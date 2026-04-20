declare module 'dom-to-image-more' {
  interface Options {
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: object;
    filter?: (node: Node) => boolean;
    cacheBust?: boolean;
    imagePlaceholder?: string;
    quality?: number;
  }
  function toBlob(node: Node, options?: Options): Promise<Blob>;
  function toPng(node: Node, options?: Options): Promise<string>;
  function toJpeg(node: Node, options?: Options): Promise<string>;
  function toSvg(node: Node, options?: Options): Promise<string>;
  export { toBlob, toPng, toJpeg, toSvg };
}
