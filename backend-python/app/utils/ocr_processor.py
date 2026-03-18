"""
OCR processor for image text recognition and table extraction.
Uses only Python standard library and built-in image processing.
"""

import logging
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class TextRegion:
    """Represents a detected text region in image."""

    text: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # (x1, y1, x2, y2)
    is_table_cell: bool = False


@dataclass
class OCRResult:
    """Result of OCR processing."""

    full_text: str
    regions: List[TextRegion]
    tables: Optional[List[Dict[str, Any]]] = None
    image_path: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "full_text": self.full_text,
            "regions": [
                {
                    "text": r.text,
                    "confidence": r.confidence,
                    "bbox": r.bbox,
                    "is_table_cell": r.is_table_cell,
                }
                for r in self.regions
            ],
            "tables": self.tables or [],
            "image_path": self.image_path,
        }


class SimpleImageProcessor:
    """Simple image processing without external libraries."""

    @staticmethod
    def load_image_data(image_path: str) -> Optional[Dict[str, Any]]:
        """
        Load image data from file.
        Supports: PNG, JPEG, BMP
        """
        try:
            with open(image_path, "rb") as f:
                data = f.read()

            # Detect image format
            if data[:8] == b"\x89PNG\r\n\x1a\n":
                return SimpleImageProcessor._parse_png(data)
            elif data[:2] == b"\xff\xd8":
                return SimpleImageProcessor._parse_jpeg(data)
            elif data[:2] == b"BM":
                return SimpleImageProcessor._parse_bmp(data)
            else:
                return None
        except Exception as e:
            logger.error(f"Error loading image: {e}")
            return None

    @staticmethod
    def _parse_png(data: bytes) -> Optional[Dict[str, Any]]:
        """Parse PNG image data."""
        try:
            # PNG signature: 8 bytes
            if data[:8] != b"\x89PNG\r\n\x1a\n":
                return None

            # Read IHDR chunk
            width = struct.unpack(">I", data[16:20])[0]
            height = struct.unpack(">I", data[20:24])[0]
            bit_depth = data[24]
            color_type = data[25]

            return {
                "format": "PNG",
                "width": width,
                "height": height,
                "bit_depth": bit_depth,
                "color_type": color_type,
                "size": len(data),
            }
        except Exception as e:
            logger.error(f"Error parsing PNG: {e}")
            return None

    @staticmethod
    def _parse_jpeg(data: bytes) -> Optional[Dict[str, Any]]:
        """Parse JPEG image data."""
        try:
            # JPEG markers
            if data[:2] != b"\xff\xd8":
                return None

            # Find SOF (Start of Frame) marker
            i = 2
            while i < len(data) - 8:
                if data[i : i + 2] in [b"\xff\xc0", b"\xff\xc1", b"\xff\xc2"]:
                    height = struct.unpack(">H", data[i + 5 : i + 7])[0]
                    width = struct.unpack(">H", data[i + 7 : i + 9])[0]
                    return {
                        "format": "JPEG",
                        "width": width,
                        "height": height,
                        "size": len(data),
                    }
                i += 1

            return {"format": "JPEG", "size": len(data)}
        except Exception as e:
            logger.error(f"Error parsing JPEG: {e}")
            return None

    @staticmethod
    def _parse_bmp(data: bytes) -> Optional[Dict[str, Any]]:
        """Parse BMP image data."""
        try:
            if data[:2] != b"BM":
                return None

            width = struct.unpack("<I", data[18:22])[0]
            height = struct.unpack("<I", data[22:26])[0]

            return {
                "format": "BMP",
                "width": width,
                "height": height,
                "size": len(data),
            }
        except Exception as e:
            logger.error(f"Error parsing BMP: {e}")
            return None


class TableDetectorAdvanced:
    """Advanced table detection from OCR results."""

    @staticmethod
    def detect_tables_from_text(text: str) -> List[Dict[str, Any]]:
        """
        Detect tables from extracted text.
        Analyzes text structure to identify table patterns.
        """
        tables: List[Dict[str, Any]] = []
        lines = text.split("\n")

        # Strategy 1: Detect pipe-separated tables
        pipe_tables = TableDetectorAdvanced._detect_pipe_tables(lines)
        tables.extend(pipe_tables)

        # Strategy 2: Detect aligned column tables
        aligned_tables = TableDetectorAdvanced._detect_aligned_tables(lines)
        tables.extend(aligned_tables)

        # Strategy 3: Detect grid-like patterns
        grid_tables = TableDetectorAdvanced._detect_grid_tables(lines)
        tables.extend(grid_tables)

        return tables

    @staticmethod
    def _detect_pipe_tables(lines: List[str]) -> List[Dict[str, Any]]:
        """Detect pipe-separated tables."""
        tables: List[Dict[str, Any]] = []
        i = 0

        while i < len(lines):
            line = lines[i].strip()

            if line.startswith("|") and line.endswith("|"):
                table_lines = [line]
                i += 1

                # Collect consecutive pipe lines
                while i < len(lines):
                    line = lines[i].strip()
                    if line.startswith("|") and line.endswith("|"):
                        table_lines.append(line)
                        i += 1
                    else:
                        break

                # Parse table
                if len(table_lines) >= 2:
                    table = TableDetectorAdvanced._parse_pipe_table(table_lines)
                    if table:
                        tables.append(table)
            else:
                i += 1

        return tables

    @staticmethod
    def _parse_pipe_table(lines: List[str]) -> Optional[Dict[str, Any]]:
        """Parse pipe-separated table."""
        try:
            headers = [col.strip() for col in lines[0].split("|")[1:-1]]

            if not headers:
                return None

            rows: List[List[str]] = []
            start_idx = 1

            # Skip separator line
            if start_idx < len(lines):
                sep_line = lines[start_idx].strip()
                if all(c in "-| " for c in sep_line):
                    start_idx = 2

            # Extract rows
            for line in lines[start_idx:]:
                cols = [col.strip() for col in line.split("|")[1:-1]]
                if len(cols) == len(headers):
                    rows.append(cols)

            if rows:
                return {
                    "type": "pipe",
                    "headers": headers,
                    "rows": rows,
                    "row_count": len(rows),
                    "col_count": len(headers),
                }
        except Exception as e:
            logger.error(f"Error parsing pipe table: {e}")

        return None

    @staticmethod
    def _detect_aligned_tables(lines: List[str]) -> List[Dict[str, Any]]:
        """Detect space/tab-aligned tables."""
        tables: List[Dict[str, Any]] = []
        i = 0

        while i < len(lines):
            line = lines[i]

            if TableDetectorAdvanced._is_header_line(line):
                table_lines = [line]
                i += 1

                # Collect aligned rows
                while i < len(lines):
                    line = lines[i]
                    if line.strip() and TableDetectorAdvanced._is_aligned_row(
                        line, table_lines[0]
                    ):
                        table_lines.append(line)
                        i += 1
                    elif not line.strip():
                        i += 1
                        break
                    else:
                        break

                # Parse table
                if len(table_lines) >= 2:
                    table = TableDetectorAdvanced._parse_aligned_table(table_lines)
                    if table:
                        tables.append(table)
            else:
                i += 1

        return tables

    @staticmethod
    def _is_header_line(line: str) -> bool:
        """Check if line is a table header."""
        stripped = line.strip()
        if not stripped or len(stripped) < 5:
            return False

        words = stripped.split()
        return len(words) >= 2

    @staticmethod
    def _is_aligned_row(line: str, header_line: str) -> bool:
        """Check if line is aligned with header."""
        if not line.strip():
            return False

        header_words = len(header_line.split())
        line_words = len(line.split())

        return abs(header_words - line_words) <= 1

    @staticmethod
    def _parse_aligned_table(lines: List[str]) -> Optional[Dict[str, Any]]:
        """Parse aligned table."""
        try:
            headers = lines[0].split()

            if not headers or len(headers) < 2:
                return None

            rows: List[List[str]] = []

            for line in lines[1:]:
                cols = line.split()
                if len(cols) >= len(headers):
                    cols = cols[: len(headers)]
                    rows.append(cols)

            if rows:
                return {
                    "type": "aligned",
                    "headers": headers,
                    "rows": rows,
                    "row_count": len(rows),
                    "col_count": len(headers),
                }
        except Exception as e:
            logger.error(f"Error parsing aligned table: {e}")

        return None

    @staticmethod
    def _detect_grid_tables(lines: List[str]) -> List[Dict[str, Any]]:
        """Detect grid-like table patterns."""
        tables: List[Dict[str, Any]] = []

        # Look for patterns with consistent spacing
        i = 0
        while i < len(lines) - 2:
            if TableDetectorAdvanced._is_grid_pattern(lines[i : i + 3]):
                # Found potential grid table
                table_lines = []
                j = i

                while j < len(lines) and TableDetectorAdvanced._is_grid_line(
                    lines[j]
                ):
                    table_lines.append(lines[j])
                    j += 1

                if len(table_lines) >= 2:
                    table = TableDetectorAdvanced._parse_grid_table(table_lines)
                    if table:
                        tables.append(table)
                i = j
            else:
                i += 1

        return tables

    @staticmethod
    def _is_grid_pattern(lines: List[str]) -> bool:
        """Check if lines form a grid pattern."""
        if len(lines) < 2:
            return False

        # Check for consistent column alignment
        for line in lines:
            if not line.strip():
                return False

        return True

    @staticmethod
    def _is_grid_line(line: str) -> bool:
        """Check if line is part of grid."""
        return bool(line.strip())

    @staticmethod
    def _parse_grid_table(lines: List[str]) -> Optional[Dict[str, Any]]:
        """Parse grid table."""
        try:
            # Simple grid parsing
            headers = lines[0].split()
            rows = [line.split() for line in lines[1:]]

            if headers and rows:
                return {
                    "type": "grid",
                    "headers": headers,
                    "rows": rows,
                    "row_count": len(rows),
                    "col_count": len(headers),
                }
        except Exception as e:
            logger.error(f"Error parsing grid table: {e}")

        return None


class OCRProcessor:
    """Main OCR processor."""

    @staticmethod
    def process_image(image_path: str, extract_tables: bool = True) -> OCRResult:
        """
        Process image and extract text and tables.

        Args:
            image_path: Path to image file
            extract_tables: Whether to extract tables

        Returns:
            OCRResult with extracted text and tables
        """
        try:
            # Load image
            img_data = SimpleImageProcessor.load_image_data(image_path)
            if not img_data:
                return OCRResult(full_text="", regions=[], image_path=image_path)

            # Detect text regions (placeholder)
            regions: List[TextRegion] = []

            # Extract full text (placeholder)
            full_text = ""

            # Extract tables if requested
            tables: Optional[List[Dict[str, Any]]] = None
            if extract_tables and full_text:
                tables = TableDetectorAdvanced.detect_tables_from_text(full_text)

            return OCRResult(
                full_text=full_text,
                regions=regions,
                tables=tables,
                image_path=image_path,
            )

        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return OCRResult(full_text="", regions=[], image_path=image_path)

    @staticmethod
    def process_document(file_path: str, extract_tables: bool = True) -> Dict[str, Any]:
        """
        Process document (image or text file).

        Args:
            file_path: Path to file
            extract_tables: Whether to extract tables

        Returns:
            Processing result
        """
        file_ext = Path(file_path).suffix.lower()

        if file_ext in [".png", ".jpg", ".jpeg", ".bmp"]:
            result = OCRProcessor.process_image(file_path, extract_tables)
            return result.to_dict()

        elif file_ext in [".txt", ".csv", ".log"]:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()

                tables: Optional[List[Dict[str, Any]]] = None
                if extract_tables:
                    tables = TableDetectorAdvanced.detect_tables_from_text(text)

                return {
                    "full_text": text,
                    "regions": [],
                    "tables": tables or [],
                    "file_path": file_path,
                }
            except Exception as e:
                logger.error(f"Error processing document: {e}")
                return {
                    "error": str(e),
                    "file_path": file_path,
                }

        else:
            return {
                "error": f"Unsupported file format: {file_ext}",
                "file_path": file_path,
            }


class BatchOCRProcessor:
    """Process multiple files in batch."""

    @staticmethod
    def process_batch(
        file_paths: List[str], extract_tables: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Process multiple files.

        Args:
            file_paths: List of file paths
            extract_tables: Whether to extract tables

        Returns:
            List of processing results
        """
        results: List[Dict[str, Any]] = []

        for file_path in file_paths:
            try:
                result = OCRProcessor.process_document(file_path, extract_tables)
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}")
                results.append({"error": str(e), "file_path": file_path})

        return results

    @staticmethod
    def export_batch_to_excel(
        results: List[Dict[str, Any]], output_file: str
    ) -> bool:
        """
        Export batch results to Excel.

        Args:
            results: List of processing results
            output_file: Output Excel file path

        Returns:
            True if successful
        """
        try:
            from app.utils.table_extractor import ExcelExporter, Table

            all_tables: List[Table] = []

            for result in results:
                if "tables" in result and result["tables"]:
                    for table_data in result["tables"]:
                        table = Table(
                            headers=table_data.get("headers", []),
                            rows=table_data.get("rows", []),
                            title=table_data.get("title"),
                        )
                        all_tables.append(table)

            if all_tables:
                return ExcelExporter.export(all_tables, output_file)
            else:
                logger.warning("No tables found to export")
                return False

        except Exception as e:
            logger.error(f"Error exporting batch: {e}")
            return False
