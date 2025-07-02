import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ReactNode } from "react";

interface VirtualizedTableProps<T> {
  data: T[];
  rowHeight?: number;
  height?: number;
  width?: number | string;
  loading?: boolean;
  error?: string | null;
  empty?: ReactNode;
  renderRow: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
}

export function VirtualizedTable<T>({
  data,
  rowHeight = 56,
  height = 480,
  width = "100%",
  loading = false,
  error,
  empty,
  renderRow,
  keyExtractor,
}: VirtualizedTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loading />
      </div>
    );
  }
  if (error) {
    return (
      <Card className="border-0 shadow-sm bg-red-50">
        <CardContent className="p-6 text-center text-red-600 font-semibold">
          {error}
        </CardContent>
      </Card>
    );
  }
  if (!data || data.length === 0) {
    return (
      empty || (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-8 text-center text-gray-400 font-semibold">
            데이터가 없습니다
          </CardContent>
        </Card>
      )
    );
  }

  // react-window row renderer
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style} key={keyExtractor(data[index])}>
      {renderRow(data[index], index)}
    </div>
  );

  return (
    <List
      height={height}
      itemCount={data.length}
      itemSize={rowHeight}
      width={width}
      overscanCount={6}
    >
      {Row}
    </List>
  );
}
