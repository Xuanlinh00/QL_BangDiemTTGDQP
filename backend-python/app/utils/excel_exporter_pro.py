"""
Professional Excel exporter with proper formatting and styles.
Creates standard-compliant .xlsx files with formatting.
"""

import logging
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class Table:
    """Represents a table."""

    headers: List[str]
    rows: List[List[str]]
    title: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {"title": self.title, "headers": self.headers, "rows": self.rows}


class ExcelStyler:
    """Excel styling utilities"""
    
    # Style IDs
    STYLE_HEADER = 1
    STYLE_TITLE = 2
    STYLE_DATA = 0
    
    @staticmethod
    def create_styles_xml() -> str:
        """Create styles.xml with proper formatting"""
        
        # Create root element
        root = ET.Element('styleSheet')
        root.set('xmlns', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
        
        # Fonts
        fonts = ET.SubElement(root, 'fonts')
        fonts.set('count', '3')
        
        # Font 0: Default
        font0 = ET.SubElement(fonts, 'font')
        ET.SubElement(font0, 'sz').set('val', '11')
        ET.SubElement(font0, 'name').set('val', 'Calibri')
        ET.SubElement(font0, 'color').set('theme', '1')
        
        # Font 1: Header (Bold)
        font1 = ET.SubElement(fonts, 'font')
        ET.SubElement(font1, 'b')
        ET.SubElement(font1, 'sz').set('val', '11')
        ET.SubElement(font1, 'name').set('val', 'Calibri')
        ET.SubElement(font1, 'color').set('theme', '1')
        
        # Font 2: Title (Bold, larger)
        font2 = ET.SubElement(fonts, 'font')
        ET.SubElement(font2, 'b')
        ET.SubElement(font2, 'sz').set('val', '12')
        ET.SubElement(font2, 'name').set('val', 'Calibri')
        ET.SubElement(font2, 'color').set('theme', '1')
        
        # Fills
        fills = ET.SubElement(root, 'fills')
        fills.set('count', '3')
        
        # Fill 0: None
        fill0 = ET.SubElement(fills, 'fill')
        ET.SubElement(fill0, 'patternFill').set('patternType', 'none')
        
        # Fill 1: Gray (for header)
        fill1 = ET.SubElement(fills, 'fill')
        pattern1 = ET.SubElement(fill1, 'patternFill')
        pattern1.set('patternType', 'solid')
        ET.SubElement(pattern1, 'fgColor').set('theme', '5')
        ET.SubElement(pattern1, 'bgColor').set('indexed', '64')
        
        # Fill 2: Light gray (for title)
        fill2 = ET.SubElement(fills, 'fill')
        pattern2 = ET.SubElement(fill2, 'patternFill')
        pattern2.set('patternType', 'solid')
        ET.SubElement(pattern2, 'fgColor').set('theme', '7')
        ET.SubElement(pattern2, 'bgColor').set('indexed', '64')
        
        # Borders
        borders = ET.SubElement(root, 'borders')
        borders.set('count', '2')
        
        # Border 0: None
        border0 = ET.SubElement(borders, 'border')
        ET.SubElement(border0, 'left')
        ET.SubElement(border0, 'right')
        ET.SubElement(border0, 'top')
        ET.SubElement(border0, 'bottom')
        ET.SubElement(border0, 'diagonal')
        
        # Border 1: All borders
        border1 = ET.SubElement(borders, 'border')
        for side in ['left', 'right', 'top', 'bottom']:
            elem = ET.SubElement(border1, side)
            elem.set('style', 'thin')
            ET.SubElement(elem, 'color').set('theme', '1')
        ET.SubElement(border1, 'diagonal')
        
        # Cell style formats
        cellStyleXfs = ET.SubElement(root, 'cellStyleXfs')
        cellStyleXfs.set('count', '1')
        xf = ET.SubElement(cellStyleXfs, 'xf')
        xf.set('numFmtId', '0')
        xf.set('fontId', '0')
        xf.set('fillId', '0')
        xf.set('borderId', '0')
        
        # Cell formats
        cellXfs = ET.SubElement(root, 'cellXfs')
        cellXfs.set('count', '3')
        
        # Format 0: Default
        xf0 = ET.SubElement(cellXfs, 'xf')
        xf0.set('numFmtId', '0')
        xf0.set('fontId', '0')
        xf0.set('fillId', '0')
        xf0.set('borderId', '1')
        xf0.set('xfId', '0')
        
        # Format 1: Header
        xf1 = ET.SubElement(cellXfs, 'xf')
        xf1.set('numFmtId', '0')
        xf1.set('fontId', '1')
        xf1.set('fillId', '1')
        xf1.set('borderId', '1')
        xf1.set('xfId', '0')
        xf1.set('applyFont', '1')
        xf1.set('applyFill', '1')
        xf1.set('applyBorder', '1')
        xf1.set('applyAlignment', '1')
        alignment1 = ET.SubElement(xf1, 'alignment')
        alignment1.set('horizontal', 'center')
        alignment1.set('vertical', 'center')
        alignment1.set('wrapText', '1')
        
        # Format 2: Title
        xf2 = ET.SubElement(cellXfs, 'xf')
        xf2.set('numFmtId', '0')
        xf2.set('fontId', '2')
        xf2.set('fillId', '2')
        xf2.set('borderId', '0')
        xf2.set('xfId', '0')
        xf2.set('applyFont', '1')
        xf2.set('applyFill', '1')
        
        # Cell styles
        cellStyles = ET.SubElement(root, 'cellStyles')
        cellStyles.set('count', '1')
        cellStyle = ET.SubElement(cellStyles, 'cellStyle')
        cellStyle.set('name', 'Normal')
        cellStyle.set('xfId', '0')
        cellStyle.set('builtinId', '0')
        
        return ET.tostring(root, encoding='unicode')


class ExcelWorksheet:
    """Excel worksheet generator"""
    
    def __init__(self):
        self.rows = []
        self.col_widths = {}
        self.merged_cells = []
    
    def add_title(self, title: str, col_count: int):
        """Add title row"""
        self.rows.append({
            'type': 'title',
            'cells': [{'value': title, 'style': 2}],
            'merge': (1, col_count)
        })
    
    def add_header(self, headers: List[str]):
        """Add header row"""
        cells = [{'value': h, 'style': 1} for h in headers]
        self.rows.append({
            'type': 'header',
            'cells': cells
        })
        
        # Auto-calculate column widths
        for i, header in enumerate(headers):
            width = max(len(header) + 2, self.col_widths.get(i, 0))
            self.col_widths[i] = width
    
    def add_row(self, values: List[str]):
        """Add data row"""
        cells = [{'value': v, 'style': 0} for v in values]
        self.rows.append({
            'type': 'data',
            'cells': cells
        })
        
        # Update column widths
        for i, value in enumerate(values):
            width = max(len(str(value)) + 1, self.col_widths.get(i, 0))
            self.col_widths[i] = width
    
    def add_empty_row(self):
        """Add empty row for spacing"""
        self.rows.append({
            'type': 'empty',
            'cells': []
        })
    
    def to_xml(self) -> str:
        """Convert to worksheet XML"""
        root = ET.Element('worksheet')
        root.set('xmlns', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
        
        # Sheet properties
        sheetPr = ET.SubElement(root, 'sheetPr')
        sheetPr.set('filterOn', '0')
        
        # Column widths
        cols = ET.SubElement(root, 'cols')
        for col_idx, width in self.col_widths.items():
            col = ET.SubElement(cols, 'col')
            col.set('min', str(col_idx + 1))
            col.set('max', str(col_idx + 1))
            col.set('width', str(min(width, 50)))  # Max width 50
            col.set('customWidth', '1')
        
        # Sheet data
        sheetData = ET.SubElement(root, 'sheetData')
        
        row_num = 1
        for row_data in self.rows:
            if row_data['type'] == 'empty':
                row_num += 1
                continue
            
            row = ET.SubElement(sheetData, 'row')
            row.set('r', str(row_num))
            row.set('spans', f'1:{len(row_data["cells"])}')
            
            for col_idx, cell_data in enumerate(row_data['cells'], 1):
                col_letter = self._get_column_letter(col_idx)
                cell_ref = f'{col_letter}{row_num}'
                
                cell = ET.SubElement(row, 'c')
                cell.set('r', cell_ref)
                cell.set('t', 'inlineStr')
                cell.set('s', str(cell_data.get('style', 0)))
                
                is_elem = ET.SubElement(cell, 'is')
                t_elem = ET.SubElement(is_elem, 't')
                t_elem.text = str(cell_data['value'])
            
            row_num += 1
        
        # Merged cells
        if self.merged_cells:
            mergeCells = ET.SubElement(root, 'mergeCells')
            mergeCells.set('count', str(len(self.merged_cells)))
            for merge_range in self.merged_cells:
                mergeCell = ET.SubElement(mergeCells, 'mergeCell')
                mergeCell.set('ref', merge_range)
        
        return ET.tostring(root, encoding='unicode')
    
    @staticmethod
    def _get_column_letter(col_num: int) -> str:
        """Convert column number to letter"""
        result = ''
        while col_num > 0:
            col_num -= 1
            result = chr(65 + col_num % 26) + result
            col_num //= 26
        return result


class ProfessionalExcelExporter:
    """Professional Excel exporter"""
    
    @staticmethod
    def export(tables: List[Table], filename: str) -> bool:
        """
        Export tables to professional Excel file.
        
        Args:
            tables: List of Table objects
            filename: Output filename
        
        Returns:
            True if successful
        """
        try:
            # Create worksheet
            worksheet = ExcelWorksheet()
            
            # Add tables
            for i, table in enumerate(tables):
                if i > 0:
                    worksheet.add_empty_row()
                
                # Add title
                if table.title:
                    worksheet.add_title(table.title, len(table.headers))
                    worksheet.add_empty_row()
                
                # Add headers
                worksheet.add_header(table.headers)
                
                # Add rows
                for row in table.rows:
                    worksheet.add_row(row)
            
            # Create XLSX file
            ProfessionalExcelExporter._create_xlsx(filename, worksheet)
            return True
        
        except Exception as e:
            print(f"Error exporting to Excel: {e}")
            return False
    
    @staticmethod
    def _create_xlsx(filename: str, worksheet: ExcelWorksheet):
        """Create XLSX file"""
        
        with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as xlsx:
            # [Content_Types].xml
            content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>'''
            xlsx.writestr('[Content_Types].xml', content_types)
            
            # _rels/.rels
            rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''
            xlsx.writestr('_rels/.rels', rels)
            
            # xl/_rels/workbook.xml.rels
            workbook_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''
            xlsx.writestr('xl/_rels/workbook.xml.rels', workbook_rels)
            
            # xl/workbook.xml
            workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<workbookPr date1904="false"/>
<sheets>
<sheet name="Sheet1" sheetId="1" r:id="rId1"/>
</sheets>
</workbook>'''
            xlsx.writestr('xl/workbook.xml', workbook)
            
            # xl/styles.xml
            styles_xml = ExcelStyler.create_styles_xml()
            xlsx.writestr('xl/styles.xml', styles_xml)
            
            # xl/worksheets/sheet1.xml
            sheet_xml = worksheet.to_xml()
            xlsx.writestr('xl/worksheets/sheet1.xml', sheet_xml)
            
            # xl/sharedStrings.xml (empty for now)
            shared_strings = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="0" uniqueCount="0"/>'''
            xlsx.writestr('xl/sharedStrings.xml', shared_strings)
