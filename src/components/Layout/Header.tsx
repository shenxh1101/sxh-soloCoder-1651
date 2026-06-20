import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const today = format(new Date(), "yyyy年M月d日 EEEE", { locale: zhCN });

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <span className="text-sm text-gray-500">{today}</span>
    </header>
  );
}
