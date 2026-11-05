import {
  AlertCircle, AlertTriangle, ArrowLeft, BadgeCheck, BarChart3, BookOpen, Bot, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronUp,
  ClipboardCheck, ClipboardList, ClipboardPlus, CloudUpload, Copy, Cpu, Download, ExternalLink, Eye, FileText, Flag, GraduationCap,
  Headphones, HelpCircle, Hourglass, Inbox, Info, Layers, LayoutDashboard, Library, Lightbulb, Loader2, Lock, LogOut, MailCheck, Megaphone, Mic,
  Music, Pause, Pencil, PenLine, Play, PlayCircle, Plus, PlusCircle, Presentation, RefreshCw, Rocket, Save, Search, SearchX, Send, Shield,
  Sparkles, Trash2, Upload, User, UserCog, Users, UserX, X, Clock, type LucideIcon, type LucideProps,
} from "lucide-react";

/** Tên Material Symbols cũ → lucide, để các màn chưa viết lại vẫn dùng chung một bộ icon. */
const MAP: Record<string, LucideIcon> = {
  add: Plus, add_circle: PlusCircle, admin_panel_settings: Shield, analytics: BarChart3, arrow_back: ArrowLeft, assignment: ClipboardList,
  assignment_add: ClipboardPlus, assignment_turned_in: ClipboardCheck, auto_awesome: Sparkles, bar_chart: BarChart3, campaign: Megaphone,
  check: Check, check_circle: CheckCircle2, chevron_right: ChevronRight, close: X, cloud_upload: CloudUpload, co_present: Presentation,
  content_copy: Copy, dashboard: LayoutDashboard, delete: Trash2, description: FileText, download: Download, edit: Pencil, edit_note: PenLine,
  error: AlertCircle, expand_less: ChevronUp, expand_more: ChevronDown, flag: Flag, group: Users, group_off: UserX, groups: Users,
  headphones: Headphones, help_outline: HelpCircle, hourglass_top: Hourglass, inbox: Inbox, info: Info, layers: Layers, library_books: Library,
  lightbulb: Lightbulb, lock: Lock, lock_clock: Lock, logout: LogOut, manage_accounts: UserCog, mark_email_read: MailCheck, memory: Cpu,
  menu_book: BookOpen, mic: Mic, music_note: Music, open_in_new: ExternalLink, pause: Pause, person: User, play_arrow: Play, play_circle: PlayCircle,
  progress_activity: Loader2, quiz: HelpCircle, record_voice_over: Mic, refresh: RefreshCw, rocket_launch: Rocket, save: Save, schedule: Clock,
  school: GraduationCap, search: Search, search_off: SearchX, send: Send, smart_toy: Bot, upload_file: Upload, verified: BadgeCheck,
  visibility: Eye, warning: AlertTriangle,
};

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

export function Icon({ name, className, ...rest }: IconProps) {
  const Cmp = MAP[name] ?? HelpCircle;
  return <Cmp className={className ?? "h-5 w-5"} aria-hidden {...rest} />;
}
