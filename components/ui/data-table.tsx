// 'use client';

// import { useState } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Search, Loader2 } from 'lucide-react';

// interface Column<T> {
//   key: keyof T | string;
//   header: string;
//   render?: (item: T) => React.ReactNode;
//   searchable?: boolean;
// }

// interface DataTableProps<T> {
//   data: T[];
//   columns: Column<T>[];
//   loading?: boolean;
//   searchPlaceholder?: string;
//   onSearch?: (term: string) => void;
//   emptyMessage?: string;
//   actions?: (item: T) => React.ReactNode;
// }

// export function DataTable<T extends Record<string, any>>({
//   data,
//   columns,
//   loading = false,
//   searchPlaceholder = "Search...",
//   onSearch,
//   emptyMessage = "No data found.",
//   actions,
// }: DataTableProps<T>) {
//   const [searchTerm, setSearchTerm] = useState('');

//   const handleSearch = (value: string) => {
//     setSearchTerm(value);
//     onSearch?.(value);
//   };

//   const filteredData = onSearch ? data : data.filter((item) => {
//     if (!searchTerm) return true;

//     return columns.some((column) => {
//       if (column.searchable === false) return false;

//       const value = column.key.includes('.') 
//         ? column.key.split('.').reduce((obj, key) => obj?.[key], item)
//         : item[column.key];

//       return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
//     });
//   });

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center gap-4">
//         <div className="relative flex-1 max-w-sm">
//           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder={searchPlaceholder}
//             className="pl-8"
//             value={searchTerm}
//             onChange={(e) => handleSearch(e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               {columns.map((column) => (
//                 <TableHead key={column.key.toString()}>
//                   {column.header}
//                 </TableHead>
//               ))}
//               {actions && <TableHead className="w-[50px]">Actions</TableHead>}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10">
//                   <div className="flex items-center justify-center">
//                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
//                     <span className="ml-2">Loading...</span>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             ) : filteredData.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10">
//                   <div className="text-muted-foreground">{emptyMessage}</div>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               filteredData.map((item, index) => (
//                 <TableRow key={item._id || index}>
//                   {columns.map((column) => (
//                     <TableCell key={column.key.toString()}>
//                       {column.render 
//                         ? column.render(item)
//                         : String(column.key).includes('.') 
//                           ? String(column.key).split('.').reduce((obj, key) => obj?.[key], item)
//                           : item[column.key]
//                       }
//                     </TableCell>
//                   ))}
//                   {actions && (
//                     <TableCell>
//                       {actions(item)}
//                     </TableCell>
//                   )}
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  searchable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchPlaceholder = "Search...",
  onSearch,
  emptyMessage = "No data found.",
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const filteredData = onSearch ? data : data.filter((item) => {
    if (!searchTerm) return true;

    return columns.some((column) => {
      if (column.searchable === false) return false;

      let value: any;

      if (typeof column.key === 'string' && column.key.includes('.')) {
        value = column.key.split('.').reduce((obj, key) => obj?.[key], item);
      } else {
        value = item[column.key as keyof T];
      }

      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key.toString()}>
                  {column.header}
                </TableHead>
              ))}
              {actions && <TableHead className="w-[50px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10">
                  <div className="text-muted-foreground">{emptyMessage}</div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item._id || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key.toString()}>
                      {column.render
                        ? column.render(item)
                        : String(column.key).includes('.')
                          ? String(column.key).split('.').reduce((obj, key) => obj?.[key], item)
                          : item[column.key]
                      }
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      {actions(item)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}