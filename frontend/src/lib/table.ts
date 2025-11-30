import type { Header } from '@tanstack/react-table';

function getSize(size = 100, max = Number.MAX_SAFE_INTEGER, min = 40) {
  return Math.max(Math.min(size, max), min);
}

export const calculateTableSizing = <DataType>(
  columns: Header<DataType, unknown>[],
  totalWidth: number,
): Record<string, number> => {
  let totalAvailableWidth = totalWidth;
  let totalIsGrow = 0;

  columns.forEach((header) => {
    const column = header.column.columnDef;

    if (!column.size) {
      if (!column.meta?.isGrow) {
        let calculatedSize = 100;
        if (column?.meta?.widthPercentage) {
          calculatedSize = column.meta.widthPercentage * totalWidth * 0.01;
        } else {
          calculatedSize = totalWidth / columns.length;
        }

        const size = getSize(calculatedSize, column.maxSize, column.minSize);

        column.size = size;
      }
    }

    if (column.meta?.isGrow) totalIsGrow += 1;
    else
      totalAvailableWidth -= getSize(
        column.size,
        column.maxSize,
        column.minSize,
      );
  });

  const sizing: Record<string, number> = {};

  columns.forEach((header) => {
    const column = header.column.columnDef;
    if (column.meta?.isGrow) {
      let calculatedSize = 100;
      calculatedSize = Math.floor(totalAvailableWidth / totalIsGrow);
      const size = getSize(calculatedSize, column.maxSize, column.minSize);
      column.size = size;
    }

    sizing[`${column.id}`] = Number(column.size);
  });

  return sizing;
};
