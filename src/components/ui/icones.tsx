/*
  Ícones do app — desenho do Carbon (IBM), traço reto e quinas vivas.

  O código chama os ícones pelos mesmos nomes de antes (Megaphone, Check,
  Loader2...), e é este arquivo que decide qual desenho do Carbon cada nome
  usa. Trocar um ícone = trocar uma linha aqui, sem caçar nos 100+ arquivos.
  Ícone novo: acrescente aqui com o nome que fizer sentido no código e o
  desenho do Carbon (https://carbondesignsystem.com/elements/icons/library/).

  A interface (size, className, aria-*) é a mesma do pacote anterior.
  strokeWidth é aceito e ignorado: os ícones do Carbon são preenchidos, a
  espessura vem do desenho.
*/
import type { ComponentType, SVGProps } from "react";
import {
  Activity as C_Activity,
  Add as C_Add,
  ArrowDown as C_ArrowDown,
  ArrowDownRight as C_ArrowDownRight,
  ArrowLeft as C_ArrowLeft,
  ArrowRight as C_ArrowRight,
  ArrowUp as C_ArrowUp,
  ArrowUpRight as C_ArrowUpRight,
  Attachment as C_Attachment,
  BatteryFull as C_BatteryFull,
  Blog as C_Blog,
  Book as C_Book,
  BookmarkAdd as C_BookmarkAdd,
  BookmarkFilled as C_BookmarkFilled,
  Box as C_Box,
  Building as C_Building,
  Bullhorn as C_Bullhorn,
  Calendar as C_Calendar,
  Camera as C_Camera,
  Catalog as C_Catalog,
  ChartCandlestick as C_ChartCandlestick,
  ChartColumn as C_ChartColumn,
  Chat as C_Chat,
  Checkmark as C_Checkmark,
  CheckmarkOutline as C_CheckmarkOutline,
  Chemistry as C_Chemistry,
  ChevronDown as C_ChevronDown,
  ChevronLeft as C_ChevronLeft,
  ChevronRight as C_ChevronRight,
  ChevronUp as C_ChevronUp,
  Chip as C_Chip,
  CircleDash as C_CircleDash,
  Close as C_Close,
  CloseOutline as C_CloseOutline,
  Column as C_Column,
  Copy as C_Copy,
  Cube as C_Cube,
  Dashboard as C_Dashboard,
  Document as C_Document,
  DocumentAdd as C_DocumentAdd,
  DocumentSigned as C_DocumentSigned,
  Download as C_Download,
  Draggable as C_Draggable,
  Earth as C_Earth,
  Edit as C_Edit,
  Education as C_Education,
  Email as C_Email,
  EventSchedule as C_EventSchedule,
  Events as C_Events,
  FaceAdd as C_FaceAdd,
  FaceSatisfied as C_FaceSatisfied,
  Finance as C_Finance,
  Fire as C_Fire,
  Flash as C_Flash,
  Folder as C_Folder,
  FolderAdd as C_FolderAdd,
  FolderOpen as C_FolderOpen,
  Forum as C_Forum,
  Hashtag as C_Hashtag,
  Headphones as C_Headphones,
  Help as C_Help,
  Image as C_Image,
  ImageCopy as C_ImageCopy,
  Information as C_Information,
  Json as C_Json,
  Language as C_Language,
  Launch as C_Launch,
  ListChecked as C_ListChecked,
  Locked as C_Locked,
  Login as C_Login,
  Logout as C_Logout,
  MagicWand as C_MagicWand,
  Maximize as C_Maximize,
  Menu as C_Menu,
  Microphone as C_Microphone,
  MicrophoneOff as C_MicrophoneOff,
  Minimize as C_Minimize,
  Moon as C_Moon,
  NoImage as C_NoImage,
  OverflowMenuHorizontal as C_OverflowMenuHorizontal,
  OverflowMenuVertical as C_OverflowMenuVertical,
  Package as C_Package,
  Password as C_Password,
  Percentage as C_Percentage,
  Phone as C_Phone,
  PhoneOff as C_PhoneOff,
  Plug as C_Plug,
  Power as C_Power,
  Quotes as C_Quotes,
  Radar as C_Radar,
  RadioButton as C_RadioButton,
  RecentlyViewed as C_RecentlyViewed,
  Renew as C_Renew,
  Repeat as C_Repeat,
  Reset as C_Reset,
  Save as C_Save,
  Screen as C_Screen,
  ScreenOff as C_ScreenOff,
  Search as C_Search,
  Security as C_Security,
  Send as C_Send,
  Settings as C_Settings,
  SettingsAdjust as C_SettingsAdjust,
  ShoppingCart as C_ShoppingCart,
  Shuffle as C_Shuffle,
  SidePanelClose as C_SidePanelClose,
  SidePanelOpen as C_SidePanelOpen,
  Sun as C_Sun,
  Task as C_Task,
  TextFont as C_TextFont,
  ThumbsDown as C_ThumbsDown,
  ThumbsUp as C_ThumbsUp,
  Time as C_Time,
  Tools as C_Tools,
  TrashCan as C_TrashCan,
  Trophy as C_Trophy,
  Undo as C_Undo,
  Upload as C_Upload,
  User as C_User,
  UserMultiple as C_UserMultiple,
  Video as C_Video,
  VideoOff as C_VideoOff,
  View as C_View,
  ViewOff as C_ViewOff,
  Wallet as C_Wallet,
  WarningAlt as C_WarningAlt,
  WarningHex as C_WarningHex,
  Wifi as C_Wifi,
  WifiOff as C_WifiOff,
} from "@carbon/icons-react";

export interface IconeProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

/** Tipo de "um ícone qualquer" — nome mantido para não mexer em quem já o usa. */
export type LucideIcon = ComponentType<IconeProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CarbonIcon = ComponentType<any>;

function icone(Desenho: CarbonIcon, nome: string): LucideIcon {
  function Icone({ size = 24, strokeWidth: _espessura, absoluteStrokeWidth: _absoluta, ...resto }: IconeProps) {
    void _espessura;
    void _absoluta;
    // Sem rótulo, o ícone é decoração e fica fora do leitor de tela.
    const decorativo = resto["aria-label"] == null && resto["aria-labelledby"] == null;
    return <Desenho size={size} aria-hidden={decorativo ? true : undefined} {...resto} />;
  }
  Icone.displayName = nome;
  return Icone;
}

export const Activity = icone(C_Activity, "Activity");
export const AlertTriangle = icone(C_WarningAlt, "AlertTriangle");
export const ArrowDown = icone(C_ArrowDown, "ArrowDown");
export const ArrowLeft = icone(C_ArrowLeft, "ArrowLeft");
export const ArrowRight = icone(C_ArrowRight, "ArrowRight");
export const ArrowUp = icone(C_ArrowUp, "ArrowUp");
export const BarChart3 = icone(C_ChartColumn, "BarChart3");
export const BatteryFull = icone(C_BatteryFull, "BatteryFull");
export const BookOpen = icone(C_Book, "BookOpen");
export const BookmarkCheck = icone(C_BookmarkFilled, "BookmarkCheck");
export const BookmarkPlus = icone(C_BookmarkAdd, "BookmarkPlus");
export const Boxes = icone(C_Cube, "Boxes");
export const Building2 = icone(C_Building, "Building2");
export const CalendarClock = icone(C_EventSchedule, "CalendarClock");
export const CalendarDays = icone(C_Calendar, "CalendarDays");
export const Camera = icone(C_Camera, "Camera");
export const CandlestickChart = icone(C_ChartCandlestick, "CandlestickChart");
export const Check = icone(C_Checkmark, "Check");
export const CheckCheck = icone(C_CheckmarkOutline, "CheckCheck");
export const CheckCircle2 = icone(C_CheckmarkOutline, "CheckCircle2");
export const ChevronDown = icone(C_ChevronDown, "ChevronDown");
export const ChevronLeft = icone(C_ChevronLeft, "ChevronLeft");
export const ChevronRight = icone(C_ChevronRight, "ChevronRight");
export const ChevronUp = icone(C_ChevronUp, "ChevronUp");
export const Circle = icone(C_RadioButton, "Circle");
export const Clock = icone(C_Time, "Clock");
export const Columns3 = icone(C_Column, "Columns3");
export const Copy = icone(C_Copy, "Copy");
export const CornerUpLeft = icone(C_Undo, "CornerUpLeft");
export const Cpu = icone(C_Chip, "Cpu");
export const Dices = icone(C_Shuffle, "Dices");
export const Download = icone(C_Download, "Download");
export const ExternalLink = icone(C_Launch, "ExternalLink");
export const Eye = icone(C_View, "Eye");
export const EyeOff = icone(C_ViewOff, "EyeOff");
export const FileJson = icone(C_Json, "FileJson");
export const FilePlus = icone(C_DocumentAdd, "FilePlus");
export const FileSignature = icone(C_DocumentSigned, "FileSignature");
export const FileText = icone(C_Document, "FileText");
export const Flame = icone(C_Fire, "Flame");
export const FlaskConical = icone(C_Chemistry, "FlaskConical");
export const Folder = icone(C_Folder, "Folder");
export const FolderOpen = icone(C_FolderOpen, "FolderOpen");
export const FolderPlus = icone(C_FolderAdd, "FolderPlus");
export const Globe = icone(C_Earth, "Globe");
export const GraduationCap = icone(C_Education, "GraduationCap");
export const GripVertical = icone(C_Draggable, "GripVertical");
export const Hash = icone(C_Hashtag, "Hash");
export const Headphones = icone(C_Headphones, "Headphones");
export const HelpCircle = icone(C_Help, "HelpCircle");
export const History = icone(C_RecentlyViewed, "History");
export const Image = icone(C_Image, "Image");
export const ImageOff = icone(C_NoImage, "ImageOff");
export const Images = icone(C_ImageCopy, "Images");
export const Inbox = icone(C_Box, "Inbox");
export const Info = icone(C_Information, "Info");
export const KanbanSquare = icone(C_Task, "KanbanSquare");
export const KeyRound = icone(C_Password, "KeyRound");
export const Landmark = icone(C_Finance, "Landmark");
export const Languages = icone(C_Language, "Languages");
export const LayoutDashboard = icone(C_Dashboard, "LayoutDashboard");
export const Library = icone(C_Catalog, "Library");
export const ListChecks = icone(C_ListChecked, "ListChecks");
export const Loader2 = icone(C_CircleDash, "Loader2");
export const Lock = icone(C_Locked, "Lock");
export const LogIn = icone(C_Login, "LogIn");
export const LogOut = icone(C_Logout, "LogOut");
export const Mail = icone(C_Email, "Mail");
export const Maximize2 = icone(C_Maximize, "Maximize2");
export const Megaphone = icone(C_Bullhorn, "Megaphone");
export const Menu = icone(C_Menu, "Menu");
export const MessageCircle = icone(C_Chat, "MessageCircle");
export const MessageSquare = icone(C_Chat, "MessageSquare");
export const MessageSquareQuote = icone(C_Quotes, "MessageSquareQuote");
export const MessagesSquare = icone(C_Forum, "MessagesSquare");
export const Mic = icone(C_Microphone, "Mic");
export const MicOff = icone(C_MicrophoneOff, "MicOff");
export const Minimize2 = icone(C_Minimize, "Minimize2");
export const Monitor = icone(C_Screen, "Monitor");
export const MonitorOff = icone(C_ScreenOff, "MonitorOff");
export const Moon = icone(C_Moon, "Moon");
export const MoreHorizontal = icone(C_OverflowMenuHorizontal, "MoreHorizontal");
export const MoreVertical = icone(C_OverflowMenuVertical, "MoreVertical");
export const Newspaper = icone(C_Blog, "Newspaper");
export const Package = icone(C_Package, "Package");
export const PanelLeft = icone(C_SidePanelOpen, "PanelLeft");
export const PanelLeftClose = icone(C_SidePanelClose, "PanelLeftClose");
export const PanelLeftOpen = icone(C_SidePanelOpen, "PanelLeftOpen");
export const Paperclip = icone(C_Attachment, "Paperclip");
export const Pencil = icone(C_Edit, "Pencil");
export const Percent = icone(C_Percentage, "Percent");
export const Phone = icone(C_Phone, "Phone");
export const PhoneOff = icone(C_PhoneOff, "PhoneOff");
export const Plug = icone(C_Plug, "Plug");
export const Plus = icone(C_Add, "Plus");
export const Power = icone(C_Power, "Power");
export const Radar = icone(C_Radar, "Radar");
export const RefreshCw = icone(C_Renew, "RefreshCw");
export const Replace = icone(C_Repeat, "Replace");
export const RotateCcw = icone(C_Reset, "RotateCcw");
export const Save = icone(C_Save, "Save");
export const Search = icone(C_Search, "Search");
export const Send = icone(C_Send, "Send");
export const Settings = icone(C_Settings, "Settings");
export const Settings2 = icone(C_SettingsAdjust, "Settings2");
export const ShieldAlert = icone(C_WarningHex, "ShieldAlert");
export const ShieldCheck = icone(C_Security, "ShieldCheck");
export const ShoppingCart = icone(C_ShoppingCart, "ShoppingCart");
export const Signal = icone(C_Wifi, "Signal");
export const SlidersHorizontal = icone(C_SettingsAdjust, "SlidersHorizontal");
export const Smile = icone(C_FaceSatisfied, "Smile");
export const SmilePlus = icone(C_FaceAdd, "SmilePlus");
export const Sparkles = icone(C_MagicWand, "Sparkles");
export const Sun = icone(C_Sun, "Sun");
export const ThumbsDown = icone(C_ThumbsDown, "ThumbsDown");
export const ThumbsUp = icone(C_ThumbsUp, "ThumbsUp");
export const Trash2 = icone(C_TrashCan, "Trash2");
export const TrendingDown = icone(C_ArrowDownRight, "TrendingDown");
export const TrendingUp = icone(C_ArrowUpRight, "TrendingUp");
export const Trophy = icone(C_Trophy, "Trophy");
export const Type = icone(C_TextFont, "Type");
export const Upload = icone(C_Upload, "Upload");
export const User = icone(C_User, "User");
export const Users = icone(C_UserMultiple, "Users");
export const UsersRound = icone(C_Events, "UsersRound");
export const Video = icone(C_Video, "Video");
export const VideoOff = icone(C_VideoOff, "VideoOff");
export const Wallet = icone(C_Wallet, "Wallet");
export const Wand2 = icone(C_MagicWand, "Wand2");
export const Wifi = icone(C_Wifi, "Wifi");
export const WifiOff = icone(C_WifiOff, "WifiOff");
export const Wrench = icone(C_Tools, "Wrench");
export const X = icone(C_Close, "X");
export const XCircle = icone(C_CloseOutline, "XCircle");
export const Zap = icone(C_Flash, "Zap");
