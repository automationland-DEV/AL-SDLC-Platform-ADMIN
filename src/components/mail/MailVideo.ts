import { Node, mergeAttributes } from '@tiptap/core';

export interface MailVideoOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mailVideo: {
      /** Inserts a `<video>` block into the document. */
      setMailVideo: (options: {
        src: string;
        poster?: string | null;
        width?: number | string | null;
        height?: number | string | null;
      }) => ReturnType;
    };
  }
}

/**
 * Minimal `<video>` node.
 *
 * Tiptap does not ship an official video extension, and a mail body needs one
 * that survives the backend sanitizer: the sanitizer only keeps `src`,
 * `poster`, `width`, `height`, `controls` and `preload` on a video tag, so the
 * node renders exactly those attributes.
 */
export const MailVideo = Node.create<MailVideoOptions>({
  name: 'mailVideo',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
      },
      poster: {
        default: null,
        parseHTML: (element) => element.getAttribute('poster'),
      },
      controls: {
        default: true,
        parseHTML: () => true,
        renderHTML: (attributes) => (attributes.controls ? { controls: 'controls' } : {}),
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => (attributes.width ? { width: attributes.width } : {}),
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height'),
        renderHTML: (attributes) => (attributes.height ? { height: attributes.height } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'mail-video max-w-full rounded-lg',
      }),
    ];
  },

  addCommands() {
    return {
      setMailVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});

export default MailVideo;
