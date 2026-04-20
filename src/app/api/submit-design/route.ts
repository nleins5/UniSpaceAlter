import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/orderService';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const frontDesign = formData.get('frontDesign') as File | null;
    const backDesign = formData.get('backDesign') as File | null;
    const orderInfoRaw = formData.get('orderInfo') as string;
    const tshirtColor = (formData.get('tshirtColor') as string) || '#FFFFFF';

    if (!frontDesign && !backDesign) {
      return NextResponse.json({ error: 'No design files' }, { status: 400 });
    }

    let orderInfo = {
      name: 'Unknown', phone: '', address: '', className: '', note: '',
      sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    };

    if (orderInfoRaw) {
      try { orderInfo = JSON.parse(orderInfoRaw); } catch { /* use defaults */ }
    }

    const totalQty = Object.values(orderInfo.sizes).reduce((a, b) => a + b, 0);
    const sizeLabel = Object.entries(orderInfo.sizes)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}×${v}`)
      .join(', ') || 'N/A';

    // Convert blobs to Buffers
    const frontBuffer = frontDesign ? Buffer.from(await frontDesign.arrayBuffer()) : undefined;
    const backBuffer = backDesign ? Buffer.from(await backDesign.arrayBuffer()) : undefined;

    // Save to Supabase via existing createOrder service
    const result = await createOrder(
      {
        customerName: orderInfo.name,
        phone: orderInfo.phone,
        address: orderInfo.address,
        color: tshirtColor,
        size: sizeLabel,
        quantity: totalQty || 1,
        notes: [
          orderInfo.className ? `Lớp: ${orderInfo.className}` : '',
          orderInfo.note || '',
        ].filter(Boolean).join(' | '),
        status: 'pending',
        hasFrontDesign: Boolean(frontBuffer),
        hasBackDesign: Boolean(backBuffer),
      },
      frontBuffer,
      backBuffer,
    );

    return NextResponse.json({ success: true, orderId: result.orderId });
  } catch (err) {
    console.error('Submit design error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
