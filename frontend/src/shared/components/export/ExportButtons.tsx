import { FileSpreadsheet, FileText } from 'lucide-react'
import Button from '../ui/Button'
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from '../../../lib/professional-export'

interface ExportButtonsProps<T extends Record<string, any>> {
  data: T[]
  columns: Record<string, string>
  title: string
  subtitle?: string
  department?: string
  author?: string
  pdfColumns?: Record<string, string> // Columnas opcionales para PDF (menos columnas)
}

export default function ExportButtons<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  department = 'Sistemas',
  author = 'Sistema',
  pdfColumns
}: ExportButtonsProps<T>) {

  const handleExportExcel = async () => {
    const exportData = prepareDataForExport(
      data,
      columns,
      {
        title,
        subtitle: subtitle || `${data.length} registros`,
        department,
        author,
      }
    )
    await exportToProfessionalExcel(exportData)
  }

  const handleExportPDF = async () => {
    const exportData = prepareDataForExport(
      data,
      pdfColumns || columns,
      {
        title,
        subtitle: subtitle || `${data.length} registros`,
        department,
        author,
      }
    )
    await exportToProfessionalPDF(exportData)
  }

  return (
    <div className="flex gap-2">
      <Button variant="glass" size="sm" onClick={handleExportExcel}>
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Exportar Excel
      </Button>
      <Button variant="glass" size="sm" onClick={handleExportPDF}>
        <FileText className="w-4 h-4 mr-2" />
        Exportar PDF
      </Button>
    </div>
  )
}
