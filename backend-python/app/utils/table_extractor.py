"""
Table extraction and export module using only Python standard library.
Supports reading from text files and exporting to Word (.docx) and Excel (.xlsx).
"""

import re
import csv
import json
import logging
from dataclasses import dataclass
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class Table:
    """Represents an extracted table."""

    headers: List[str]
    rows: List[List[str]]
    title: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert table to dictionary."""
        return {"title": self.title, "headers": self.headers, "rows": self.rows}


class TableDetector:
    """Detects tables in text content"""
    
    @staticmethod
    def detect_tables(text: str) -> List[Table]:
        """
        Detect tables in text content.
        Supports:
        - Pipe-separated tables (|col1|col2|)
        - Tab/space-separated aligned tables
        - CSV-like formats
        """
        tables = []
        lines = text.split('\n')
        
        # Try pipe-separated format first
        pipe_tables = TableDetector._extract_pipe_tables(lines)
        tables.extend(pipe_tables)
        
        # Try aligned column format
        aligned_tables = TableDetector._extract_aligned_tables(lines)
        tables.extend(aligned_tables)
        
        return tables
    
    @staticmethod
    def _extract_pipe_tables(lines: List[str]) -> List[Table]:
        """Extract pipe-separated tables"""
        tables = []
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Check if line is a pipe-separated row
            if line.startswith('|') and line.endswith('|'):
                table_lines = [line]
                title = None
                
                # Look back for title
                if i > 0:
                    prev_line = lines[i - 1].strip()
                    if prev_line and not prev_line.startswith('|'):
                        title = prev_line
                
                i += 1
                
                # Collect all consecutive pipe-separated lines
                while i < len(lines):
                    line = lines[i].strip()
                    if line.startswith('|') and line.endswith('|'):
                        table_lines.append(line)
                        i += 1
                    else:
                        break
                
                # Parse table
                if len(table_lines) >= 2:
                    table = TableDetector._parse_pipe_table(table_lines, title)
                    if table:
                        tables.append(table)
            else:
                i += 1
        
        return tables
    
    @staticmethod
    def _parse_pipe_table(lines: List[str], title: Optional[str] = None) -> Optional[Table]:
        """Parse pipe-separated table"""
        try:
            # Extract headers from first line
            headers = [col.strip() for col in lines[0].split('|')[1:-1]]
            
            if not headers:
                return None
            
            rows = []
            
            # Skip separator line if exists (line with dashes)
            start_idx = 1
            if start_idx < len(lines):
                sep_line = lines[start_idx].strip()
                if all(c in '-| ' for c in sep_line):
                    start_idx = 2
            
            # Extract data rows
            for line in lines[start_idx:]:
                cols = [col.strip() for col in line.split('|')[1:-1]]
                if len(cols) == len(headers):
                    rows.append(cols)
            
            if rows:
                return Table(headers=headers, rows=rows, title=title)
        except Exception:
            pass
        
        return None
    
    @staticmethod
    def _extract_aligned_tables(lines: List[str]) -> List[Table]:
        """Extract space/tab-aligned tables"""
        tables = []
        i = 0
        
        while i < len(lines):
            # Look for potential header line (multiple words separated by spaces)
            line = lines[i]
            
            if TableDetector._is_potential_header(line):
                table_lines = [line]
                title = None
                
                # Look back for title
                if i > 0:
                    prev_line = lines[i - 1].strip()
                    if prev_line and not TableDetector._is_potential_header(prev_line):
                        title = prev_line
                
                i += 1
                
                # Collect aligned rows
                while i < len(lines):
                    line = lines[i]
                    if line.strip() and TableDetector._is_aligned_row(line, table_lines[0]):
                        table_lines.append(line)
                        i += 1
                    elif not line.strip():
                        i += 1
                        break
                    else:
                        break
                
                # Parse table
                if len(table_lines) >= 2:
                    table = TableDetector._parse_aligned_table(table_lines, title)
                    if table:
                        tables.append(table)
            else:
                i += 1
        
        return tables
    
    @staticmethod
    def _is_potential_header(line: str) -> bool:
        """Check if line could be a table header"""
        stripped = line.strip()
        if not stripped or len(stripped) < 5:
            return False
        
        # Should have multiple words
        words = stripped.split()
        return len(words) >= 2
    
    @staticmethod
    def _is_aligned_row(line: str, header_line: str) -> bool:
        """Check if line is aligned with header"""
        if not line.strip():
            return False
        
        # Simple heuristic: similar number of words
        header_words = len(header_line.split())
        line_words = len(line.split())
        
        return abs(header_words - line_words) <= 1
    
    @staticmethod
    def _parse_aligned_table(lines: List[str], title: Optional[str] = None) -> Optional[Table]:
        """Parse space-aligned table"""
        try:
            # Extract headers
            headers = lines[0].split()
            
            if not headers or len(headers) < 2:
                return None
            
            rows = []
            
            # Extract data rows
            for line in lines[1:]:
                cols = line.split()
                if len(cols) >= len(headers):
                    # Pad or trim to match header count
                    cols = cols[:len(headers)]
                    rows.append(cols)
            
            if rows:
                return Table(headers=headers, rows=rows, title=title)
        except Exception:
            pass
        
        return None


class WordExporter:
    """Export tables to Word format (.docx) using only standard library"""
    
    @staticmethod
    def export(tables: List[Table], filename: str) -> bool:
        """
        Export tables to Word document.
        Creates a minimal valid .docx file.
        """
        try:
            # Create document XML
            doc_xml = WordExporter._create_document_xml(tables)
            
            # Create .docx (which is a ZIP file)
            WordExporter._create_docx_file(filename, doc_xml)
            return True
        except Exception as e:
            print(f"Error exporting to Word: {e}")
            return False
    
    @staticmethod
    def _create_document_xml(tables: List[Table]) -> str:
        """Create Word document XML content"""
        xml_parts = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
            '<w:body>'
        ]
        
        for table in tables:
            if table.title:
                xml_parts.append(f'<w:p><w:r><w:t>{WordExporter._escape_xml(table.title)}</w:t></w:r></w:p>')
            
            xml_parts.append(WordExporter._create_table_xml(table))
            xml_parts.append('<w:p/>')  # Add spacing
        
        xml_parts.extend(['</w:body>', '</w:document>'])
        
        return '\n'.join(xml_parts)
    
    @staticmethod
    def _create_table_xml(table: Table) -> str:
        """Create table XML"""
        xml = ['<w:tbl>']
        
        # Table properties
        xml.append('<w:tblPr><w:tblW w:w="5000" w:type="auto"/></w:tblPr>')
        
        # Header row
        xml.append('<w:tr>')
        for header in table.headers:
            xml.append(f'<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>{WordExporter._escape_xml(header)}</w:t></w:r></w:p></w:tc>')
        xml.append('</w:tr>')
        
        # Data rows
        for row in table.rows:
            xml.append('<w:tr>')
            for cell in row:
                xml.append(f'<w:tc><w:p><w:r><w:t>{WordExporter._escape_xml(cell)}</w:t></w:r></w:p></w:tc>')
            xml.append('</w:tr>')
        
        xml.append('</w:tbl>')
        return '\n'.join(xml)
    
    @staticmethod
    def _escape_xml(text: str) -> str:
        """Escape XML special characters"""
        return (text.replace('&', '&amp;')
                   .replace('<', '&lt;')
                   .replace('>', '&gt;')
                   .replace('"', '&quot;')
                   .replace("'", '&apos;'))
    
    @staticmethod
    def _create_docx_file(filename: str, doc_xml: str):
        """Create .docx file (ZIP archive)"""
        import zipfile
        import io
        
        # Create ZIP file
        with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as docx:
            # Add [Content_Types].xml
            content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''
            docx.writestr('[Content_Types].xml', content_types)
            
            # Add _rels/.rels
            rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''
            docx.writestr('_rels/.rels', rels)
            
            # Add word/document.xml
            docx.writestr('word/document.xml', doc_xml)


class ExcelExporter:
    """Export tables to Excel format (.xlsx) using professional exporter"""
    
    @staticmethod
    def export(tables: List[Table], filename: str) -> bool:
        """
        Export tables to professional Excel file.
        Uses excel_exporter_pro for better formatting.
        """
        try:
            from app.utils.excel_exporter_pro import ProfessionalExcelExporter
            return ProfessionalExcelExporter.export(tables, filename)
        except Exception as e:
            print(f"Error exporting to Excel: {e}")
            return False


class FileProcessor:
    """Main processor for reading files and exporting tables"""
    
    @staticmethod
    def process_file(input_file: str, output_format: str = 'excel', output_file: Optional[str] = None) -> bool:
        """
        Process file and export tables.
        
        Args:
            input_file: Path to input file (txt, csv, etc.)
            output_format: 'excel' or 'word'
            output_file: Output file path (auto-generated if not provided)
        
        Returns:
            True if successful
        """
        try:
            # Read file
            with open(input_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Detect tables
            tables = TableDetector.detect_tables(content)
            
            if not tables:
                print("No tables detected in file")
                return False
            
            # Generate output filename if not provided
            if not output_file:
                base_name = input_file.rsplit('.', 1)[0]
                ext = 'xlsx' if output_format == 'excel' else 'docx'
                output_file = f"{base_name}_output.{ext}"
            
            # Export
            if output_format == 'excel':
                return ExcelExporter.export(tables, output_file)
            elif output_format == 'word':
                return WordExporter.export(tables, output_file)
            else:
                print(f"Unknown format: {output_format}")
                return False
        
        except Exception as e:
            print(f"Error processing file: {e}")
            return False
