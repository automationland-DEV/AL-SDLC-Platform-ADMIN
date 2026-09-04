import { useState } from "react";
import { type ColorResult, SketchPicker } from "react-color";
import { type Level } from "@tiptap/extension-heading";
import { type Editor } from "@tiptap/react";
import toast from "react-hot-toast";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ChevronDownIcon,
  HighlighterIcon,
  ImageIcon,
  ItalicIcon,
  Link2Icon,
  ListCollapseIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  type LucideIcon,
  MessageSquarePlusIcon,
  MinusIcon,
  PlusIcon,
  PrinterIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  SearchIcon,
  SpellCheckIcon,
  TableIcon,
  UnderlineIcon,
  Undo2Icon,
  UploadIcon
} from "lucide-react";

import TableGridPicker from "./TableGridPicker";
import { insertTableWithColWidths } from "./tableUtils";

import { cn } from "../../lib/utils";
import { Separator } from "../ui/separator";
import { useEditorStore } from "../../stores/useEditorStore";
import { useTranslation } from "../../i18n/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
      className
    )}
    {...props}
  />
);

const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-sky-600 text-white shadow-xs hover:bg-sky-500 h-9 px-4 py-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
      className
    )}
    {...props}
  />
);

const LineHeightButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const lineHeights = [
    { label: t('toolbar.lineHeightDefault'), value: "normal" },
    { label: t('toolbar.lineHeightSingle'), value: "1" },
    { label: t('toolbar.lineHeight115'), value: "1.15" },
    { label: t('toolbar.lineHeight15'), value: "1.5" },
    { label: t('toolbar.lineHeightDouble'), value: "2" },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer"
          title={t('toolbar.lineHeight')}
        >
          <ListCollapseIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1.5 flex flex-col gap-y-1 min-w-[170px]">
        {lineHeights.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => {
              editor?.chain().focus().setLineHeight(value).run();
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80 text-left text-sm cursor-pointer",
              editor?.getAttributes("paragraph").lineHeight === value && "bg-neutral-200/80 font-medium"
            )}
          >
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FontSizeButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const getHeadingDefaultSize = () => {
    if (editor?.getAttributes("textStyle")?.fontSize === "11px") return "11";
    for (let level = 1; level <= 5; level++) {
      if (editor?.isActive("heading", { level })) {
        if (level === 1) return "16";
        if (level === 2) return "13";
        if (level === 3) return "13";
        if (level === 4) return "13";
        if (level === 5) return "13";
      }
    }
    return "13";
  };

  const currentFontSize = editor?.getAttributes("textStyle").fontSize
    ? editor?.getAttributes("textStyle").fontSize.replace("px", "")
    : getHeadingDefaultSize();

  const [fontSize, setFontSize] = useState(currentFontSize);
  const [inputValue, setInputValue] = useState(fontSize);
  const [isEditing, setIsEditing] = useState(false);

  const displaySize = isEditing ? inputValue : (editor?.getAttributes("textStyle").fontSize?.replace("px", "") || getHeadingDefaultSize());

  const updateFontSize = (newSize: string) => {
    const size = parseInt(newSize);
    if (!isNaN(size) && size > 0 && size <= 144) {
      editor?.chain().focus().setFontSize(`${size}px`).run();
      setFontSize(newSize);
      setInputValue(newSize);
      setIsEditing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    updateFontSize(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateFontSize(inputValue);
      editor?.commands.focus();
    }
  };

  const increment = () => {
    const current = parseInt(displaySize) || 16;
    const newSize = current + 1;
    updateFontSize(newSize.toString());
  };

  const decrement = () => {
    const current = parseInt(displaySize) || 16;
    const newSize = current - 1;
    if (newSize > 0) {
      updateFontSize(newSize.toString());
    }
  };

  return (
    <div className="flex items-center gap-x-0.5">
      <button
        onClick={decrement}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 cursor-pointer"
        title={t('toolbar.decreaseFontSize')}
      >
        <MinusIcon className="size-4" />
      </button>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-7 w-10 text-sm text-center border border-neutral-400 rounded-sm bg-transparent focus:outline-none focus:ring-0"
        />
      ) : (
        <button
          onClick={() => {
            setIsEditing(true);
            setFontSize(displaySize);
            setInputValue(displaySize);
          }}
          className="h-7 w-10 text-sm text-center border border-neutral-400 rounded-sm hover:bg-neutral-200/80 cursor-pointer"
          title={t('toolbar.fontSize')}
        >
          {displaySize}
        </button>
      )}
      <button
        onClick={increment}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 cursor-pointer"
        title={t('toolbar.increaseFontSize')}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
};

const AlignButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const alignments = [
    {
      label: t('toolbar.alignLeft'),
      value: "left",
      icon: AlignLeftIcon,
    },
    {
      label: t('toolbar.alignCenter'),
      value: "center",
      icon: AlignCenterIcon
    },
    {
      label: t('toolbar.alignRight'),
      value: "right",
      icon: AlignRightIcon
    },
    {
      label: t('toolbar.alignJustify'),
      value: "justify",
      icon: AlignJustifyIcon
    }
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer"
          title={t('toolbar.alignment')}
        >
          <AlignLeftIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1.5 flex flex-col gap-y-1 min-w-[180px]">
        {alignments.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => {
              editor?.chain().focus().setTextAlign(value).run();
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80 text-left cursor-pointer",
              editor?.isActive({ textAlign: value }) && "bg-neutral-200/80 font-medium"
            )}
          >
            <Icon className="size-4" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ImageButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const onChange = (src: string) => {
    editor?.chain().focus().setImage({ src }).run();
  };

  const onUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) onChange(result);
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl.trim()) {
      onChange(imageUrl.trim());
      setImageUrl("");
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer"
            title={t('toolbar.insertImage')}
          >
            <ImageIcon className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onUpload} className="cursor-pointer">
            <UploadIcon className="size-4 mr-2" />
            {t('toolbar.uploadFromComputer')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="cursor-pointer">
            <SearchIcon className="size-4 mr-2" />
            {t('toolbar.pasteImageUrl')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('toolbar.insertImageUrlTitle')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="https://example.com/image.png"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleImageUrlSubmit();
              }
            }}
          />
          <DialogFooter>
            <Button onClick={handleImageUrlSubmit}>
              {t('toolbar.insertBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const LinkButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");

  const onChange = (href: string) => {
    if (!href.trim()) return;
    if (editor?.state.selection.empty) {
      editor?.chain().focus().insertContent({
        type: "text",
        text: href,
        marks: [{ type: "link", attrs: { href } }],
      }).run();
    } else {
      editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setValue("");
    setIsOpen(false);
  };

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setValue(editor?.getAttributes("link").href || "");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer",
            editor?.isActive("link") && "bg-neutral-200/80"
          )}
          title={t('toolbar.link')}
        >
          <Link2Icon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2.5 flex items-center gap-x-2">
        <Input
          placeholder="https://example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onChange(value);
            }
          }}
        />
        <Button onClick={() => onChange(value)}>
          {t('toolbar.apply')}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TableButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={(e) => setAnchorEl((prev) => (prev ? null : e.currentTarget))}
        className={cn(
          "h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer",
          (Boolean(anchorEl) || editor?.isActive("table")) && "bg-neutral-200/80 text-blue-600 dark:text-blue-400"
        )}
        title={t('toolbar.insertTable')}
      >
        <TableIcon className="size-4" />
      </button>

      {Boolean(anchorEl) && (
        <TableGridPicker
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          onSelect={(rows, cols) => {
            if (editor) {
              insertTableWithColWidths(editor, rows, cols, true);
            }
            setAnchorEl(null);
          }}
        />
      )}
    </>
  );
};

const TableOperationsButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  if (!editor?.isActive("table")) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 px-2 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer"
          title={t('toolbar.tableOperations')}
        >
          {t('toolbar.table')}
          <ChevronDownIcon className="ml-1 size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1.5 min-w-[210px] flex flex-col gap-1">
        <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()} className="cursor-pointer text-sm">
          {t('toolbar.addRowBefore')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} className="cursor-pointer text-sm">
          {t('toolbar.addRowAfter')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} className="cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
          {t('toolbar.deleteRow')}
        </DropdownMenuItem>
        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} className="cursor-pointer text-sm">
          {t('toolbar.addColumnBefore')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} className="cursor-pointer text-sm">
          {t('toolbar.addColumnAfter')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} className="cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
          {t('toolbar.deleteColumn')}
        </DropdownMenuItem>
        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="cursor-pointer text-sm font-medium text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
          {t('toolbar.deleteTable')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const HighlightColorButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const value = editor?.getAttributes('highlight')?.color || "#FFFFFFFF";

  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setHighlight({ color: color.hex }).run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer"
          title={t('toolbar.highlightColor')}
        >
          <HighlighterIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border-0 bg-transparent shadow-none" onCloseAutoFocus={(e) => e.preventDefault()}>
        <SketchPicker
          color={value}
          onChange={onChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TextColorButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const value = editor?.getAttributes("textStyle")?.color || "#000000";

  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setColor(color.hex).run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer"
          title={t('toolbar.textColor')}
        >
          <span className="text-xs font-semibold">A</span>
          <div className="h-0.5 w-full" style={{ backgroundColor: value }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border-0 bg-transparent shadow-none" onCloseAutoFocus={(e) => e.preventDefault()}>
        <SketchPicker
          color={value}
          onChange={onChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const HeadingLevelButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const headings: {
    label: string;
    value: number;
    fontSize: string;
    fontWeight?: string;
    textTransform?: React.CSSProperties['textTransform'];
    fontStyle?: React.CSSProperties['fontStyle'];
    textAlign?: React.CSSProperties['textAlign'];
  }[] = [
    {
      label: t('toolbar.normalText'),
      value: 0,
      fontSize: "13px",
      fontWeight: "normal",
      textAlign: "left"
    },
    {
      label: t('toolbar.heading1'),
      value: 1,
      fontSize: "16px",
      fontWeight: "bold",
      textTransform: "uppercase",
      textAlign: "center"
    },
    {
      label: t('toolbar.heading2'),
      value: 2,
      fontSize: "13px",
      fontWeight: "bold",
      textTransform: "none",
      textAlign: "left"
    },
    {
      label: t('toolbar.heading3'),
      value: 3,
      fontSize: "13px",
      fontWeight: "bold",
      textTransform: "none",
      textAlign: "left"
    },
    {
      label: t('toolbar.tableTitle'),
      value: 10,
      fontSize: "13px",
      fontWeight: "bold",
      textTransform: "none",
      textAlign: "center"
    },
    {
      label: t('toolbar.sourceUnit'),
      value: 11,
      fontSize: "11px",
      fontStyle: "italic",
      textAlign: "left"
    },
  ];

  const getCurrentHeading = () => {
    if (editor?.getAttributes("textStyle")?.fontSize === "11px") {
      return t('toolbar.sourceUnit');
    }
    for (let level = 1; level <= 3; level++) {
      if (editor?.isActive("heading", { level })) {
        if (level === 1) return t('toolbar.heading1');
        if (level === 2) return t('toolbar.heading2');
        if (level === 3) return t('toolbar.heading3');
      }
    }

    return t('toolbar.normalText');
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 w-[235px] shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-2 overflow-hidden text-sm cursor-pointer"
          title={t('toolbar.styles')}
        >
          <span className="truncate text-left flex-1">
            {getCurrentHeading()}
          </span>
          <ChevronDownIcon className="ml-1.5 size-4 shrink-0 text-neutral-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1.5 flex flex-col gap-y-1 min-w-[270px]">
        {headings.map(({ label, value, fontSize, fontWeight, textTransform, fontStyle, textAlign }) => (
          <button
            key={value}
            style={{
              fontSize,
              fontWeight: fontWeight === 'bold' ? 700 : 400,
              textTransform: textTransform || 'none',
              fontStyle: fontStyle || 'normal',
              textAlign: textAlign || 'left'
            }}
            onClick={() => {
              if (value === 0) {
                // Normal: 13pt, justified, regular
                editor?.chain().focus().setParagraph().setTextAlign('justify').unsetFontSize().unsetBold().unsetItalic().run();
              } else if (value === 1) {
                // Heading 1: 16pt, bold, uppercase, center
                editor?.chain().focus().toggleHeading({ level: 1 }).setTextAlign('center').unsetFontSize().run();
              } else if (value === 2) {
                // Heading 2: 13pt, bold, lowercase, left
                editor?.chain().focus().toggleHeading({ level: 2 }).setTextAlign('left').unsetFontSize().run();
              } else if (value === 3) {
                // Heading 3: 13pt, bold, lowercase, left
                editor?.chain().focus().toggleHeading({ level: 3 }).setTextAlign('left').unsetFontSize().run();
              } else if (value === 10) {
                // Table/Figure: 13pt, bold, center
                editor?.chain().focus().setParagraph().setFontSize('13px').setTextAlign('center').setBold().unsetItalic().run();
              } else if (value === 11) {
                // Source, Unit: 11pt, italic, left
                editor?.chain().focus().setParagraph().setFontSize('11px').setTextAlign('left').setItalic().unsetBold().run();
              }
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-x-2 px-2 py-1.5 rounded-sm hover:bg-neutral-200/80 text-left cursor-pointer",
              ((value === 0 && !editor?.isActive("heading") && editor?.getAttributes("textStyle")?.fontSize !== "11px") ||
                (value >= 1 && value <= 3 && editor?.isActive("heading", { level: value as Level })) ||
                (value === 11 && editor?.getAttributes("textStyle")?.fontSize === "11px")) && "bg-neutral-200/80 font-medium"
            )}
          >
            {label}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FontFamilyButton = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fonts = [
    // Phổ biến & Hệ thống
    { label: "Arial", value: "Arial" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Calibri", value: "Calibri, sans-serif" },
    { label: "Roboto", value: "'Roboto', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Inter", value: "'Inter', sans-serif" },
    { label: "Montserrat", value: "'Montserrat', sans-serif" },
    { label: "Poppins", value: "'Poppins', sans-serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Merriweather", value: "'Merriweather', serif" },
    { label: "Lora", value: "'Lora', serif" },
    { label: "Playfair Display", value: "'Playfair Display', serif" },
    { label: "PT Serif", value: "'PT Serif', serif" },
    { label: "Roboto Slab", value: "'Roboto Slab', serif" },
    { label: "Cambria", value: "Cambria, Georgia, serif" },
    { label: "Garamond", value: "Garamond, serif" },
    { label: "Tahoma", value: "Tahoma, sans-serif" },
    { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
    { label: "Oswald", value: "'Oswald', sans-serif" },
    { label: "Courier New", value: "'Courier New', monospace" },
    { label: "Roboto Mono", value: "'Roboto Mono', monospace" },
    { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
    { label: "Impact", value: "Impact, sans-serif" },
  ];

  const filteredFonts = fonts.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  const currentFontFamily = editor?.getAttributes("textStyle")?.fontFamily;
  const currentFontLabel =
    fonts.find((f) => f.value === currentFontFamily || f.label === currentFontFamily)?.label ||
    currentFontFamily ||
    "Arial";

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setSearch("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 w-[124px] shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer"
          title={t('toolbar.fontFamily')}
        >
          <span className="truncate text-left flex-1" style={{ fontFamily: currentFontFamily || "Arial" }}>
            {currentFontLabel}
          </span>
          <ChevronDownIcon className="ml-1.5 size-4 shrink-0 text-neutral-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1.5 flex flex-col gap-y-1 min-w-[260px]">
        <div className="p-1 border-b border-neutral-200 dark:border-neutral-700">
          <input
            type="text"
            placeholder={t('toolbar.searchFont')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="max-h-72 overflow-y-auto flex flex-col gap-y-0.5 py-0.5">
          {filteredFonts.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-400 text-center">{t('toolbar.noFontFound')}</div>
          ) : (
            filteredFonts.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => {
                  editor?.chain().focus().setFontFamily(value).run();
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-sm hover:bg-neutral-200/80 text-left text-sm transition-colors cursor-pointer",
                  (currentFontFamily === value || currentFontFamily === label) && "bg-neutral-200/80 font-semibold"
                )}
                style={{ fontFamily: value }}
              >
                <span>{label}</span>
                {(currentFontFamily === value || currentFontFamily === label) && (
                  <span className="text-blue-600 text-xs font-bold">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ToolbarButtonProps {
  label?: string;
  onClick?: () => void;
  isActive?: boolean;
  icon: LucideIcon;
  title?: string;
}

const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
  title,
}: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "text-sm h-7 min-w-7 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 cursor-pointer",
        isActive && "bg-neutral-200/80 font-bold"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
};

export const Toolbar = ({ editor: propEditor }: { editor?: Editor | null }) => {
  const { t } = useTranslation();
  const { editor: storeEditor } = useEditorStore();
  const editor = propEditor || storeEditor;
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(false);

  const sections: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    isActive?: boolean;
    title?: string;
  }[][] = [
      [
        {
          label: "Undo",
          icon: Undo2Icon,
          onClick: () => editor?.chain().focus().undo().run(),
          title: t('toolbar.undo'),
        },
        {
          label: "Redo",
          icon: Redo2Icon,
          onClick: () => editor?.chain().focus().redo().run(),
          title: t('toolbar.redo'),
        },
        {
          label: "Print",
          icon: PrinterIcon,
          onClick: () => window.print(),
          title: t('toolbar.print'),
        },
        {
          label: "Spell Check",
          icon: SpellCheckIcon,
          isActive: spellCheckEnabled,
          onClick: () => {
            const current = editor?.view.dom.getAttribute("spellcheck");
            const next = current === "false" ? "true" : "false";
            editor?.view.dom.setAttribute("spellcheck", next);
            setSpellCheckEnabled(next === "true");
            toast.success(next === "true" ? t('toolbar.spellCheckOn') : t('toolbar.spellCheckOff'));
          },
          title: t('toolbar.spellCheck'),
        }
      ],
      [
        {
          label: "Bold",
          icon: BoldIcon,
          isActive: editor?.isActive("bold"),
          onClick: () => editor?.chain().focus().toggleBold().run(),
          title: t('toolbar.bold'),
        },
        {
          label: "Italic",
          icon: ItalicIcon,
          isActive: editor?.isActive("italic"),
          onClick: () => editor?.chain().focus().toggleItalic().run(),
          title: t('toolbar.italic'),
        },
        {
          label: "Underline",
          icon: UnderlineIcon,
          isActive: editor?.isActive("underline"),
          onClick: () => editor?.chain().focus().toggleUnderline().run(),
          title: t('toolbar.underline'),
        },
      ],
      [
        {
          label: "Comment",
          icon: MessageSquarePlusIcon,
          onClick: () => {
            const selection = editor?.state.selection;
            if (selection && !selection.empty) {
              const comment = window.prompt(t('toolbar.commentPrompt'));
              if (comment) {
                editor?.chain().focus().setHighlight({ color: "#fef08a" }).run();
                toast.success(`Note: "${comment.length > 30 ? comment.slice(0, 30) + '...' : comment}"`);
              }
            } else {
              toast(t('toolbar.commentSelectWarning'), { icon: "ℹ️" });
            }
          },
          isActive: false,
          title: t('toolbar.comment'),
        },
        {
          label: "List Todo",
          icon: ListTodoIcon,
          onClick: () => editor?.chain().focus().toggleTaskList().run(),
          isActive: editor?.isActive("taskList"),
          title: t('toolbar.checklist'),
        },
        {
          label: "Remove Formatting",
          icon: RemoveFormattingIcon,
          onClick: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
          title: t('toolbar.clearFormatting'),
        },
      ]
    ];

  return (
    <div className="bg-[#F1F4F9] dark:bg-[#252528] px-2.5 py-0.5 rounded-[24px] min-h-[40px] flex items-center gap-x-0.5 overflow-x-auto shadow-xs">
      {sections[0].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <Separator orientation="vertical" className="h-6 bg-neutral-300 dark:bg-neutral-600" />
      <FontFamilyButton editor={editor} />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 dark:bg-neutral-600" />
      <HeadingLevelButton editor={editor} />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 dark:bg-neutral-600" />
      <FontSizeButton editor={editor} />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 dark:bg-neutral-600" />
      {sections[1].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <TextColorButton editor={editor} />
      <HighlightColorButton editor={editor} />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 dark:bg-neutral-600" />
      <LinkButton editor={editor} />
      <ImageButton editor={editor} />
      <TableButton editor={editor} />
      <TableOperationsButton editor={editor} />
      <AlignButton editor={editor} />
      <LineHeightButton editor={editor} />
      <ToolbarButton
        label="Bullet List"
        icon={ListIcon}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        isActive={editor?.isActive("bulletList")}
        title={t('toolbar.bulletList')}
      />
      <ToolbarButton
        label="Ordered List"
        icon={ListOrderedIcon}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        isActive={editor?.isActive("orderedList")}
        title={t('toolbar.orderedList')}
      />
      {sections[2].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
    </div>
  );
};

export default Toolbar;
