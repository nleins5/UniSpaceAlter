import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/orderService';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const designBlob = formData.get('design') as File;
    const orderInfoRaw = formData.get('orderInfo') as string;
    const tshirtColor = (formData.get('tshirtColor') as string) || '#FFFFFF';

    if (!designBlob) {
      return NextResponse.json({ error: 'No design file' }, { status: 400 });
    }

    let orderInfo: {
      name: string; phone: string; address: string;
      className: string; note: string;
      sizes: { XS: number; S: number; M: number; L: number; XL: number; XXL: number };
    } = { name: 'Unknown', phone: '', address: '', className: '', note: '', sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 } };

    if (orderInfoRaw) {
      try { orderInfo = JSON.parse(orderInfoRaw); } catch { /* use defaults */ }
    }

    const totalQty = Object.values(orderInfo.sizes).reduce((a, b) => a + b, 0);
    const sizeLabel = Object.entries(orderInfo.sizes)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}×${v}`)
      .join(', ') || 'N/A';

    // Convert design blob to Buffer for Supabase upload
    const designBuffer = Buffer.from(await designBlob.arrayBuffer());

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
        hasFrontDesign: true,
        hasBackDesign: true,
      },
      designBuffer,  // front = composite design PNG
      undefined,     // back already included in composite
    );

    return NextResponse.json({ success: true, orderId: result.orderId });
  } catch (err) {
    console.error('Submit design error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
