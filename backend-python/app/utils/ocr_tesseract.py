"""
OCR using Tesseract (pytesseract wrapper).
Requires: tesseract-ocr system package and pytesseract Python package.

Installation:
- Ubuntu/Debian: sudo apt-get install tesseract-ocr
- macOS: brew install tesseract
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
"""

import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class OCRBox:
    """Bounding box for OCR result."""

    def __init__(
        self,
        text: str,
        confidence: float,
        x: int,
        y: int,
        width: int,
        height: int,
    ) -> None:
        """Initialize OCR box."""
        self.text = text
        self.confidence = confidence
        self.x = x
        self.y = y
        self.width = width
        self.height = height

    @property
    def bbox(self) -> Tuple[int, int, int, int]:
        """Get bbox as (x1, y1, x2, y2)."""
        return (self.x, self.y, self.x + self.width, self.y + self.height)


class TesseractOCR:
    """Tesseract OCR wrapper."""

    _initialized = False
    _pytesseract_available = False

    @classmethod
    def initialize(cls) -> bool:
        """Initialize Tesseract OCR."""
        if cls._initialized:
            return cls._pytesseract_available

        try:
            import pytesseract
            from PIL import Image

            cls._pytesseract_available = True
            cls._initialized = True
            return True
        except ImportError as e:
            logger.warning(f"pytesseract or PIL not installed: {e}")
            logger.warning("Install with: pip install pytesseract pillow")
            cls._initialized = True
            return False

    @classmethod
    def is_available(cls) -> bool:
        """Check if Tesseract is available."""
        if not cls._initialized:
            cls.initialize()
        return cls._pytesseract_available

    @staticmethod
    def extract_text(image_path: str, lang: str = "eng") -> str:
        """
        Extract text from image using Tesseract.

        Args:
            image_path: Path to image file
            lang: Language code (eng, vie, etc.)

        Returns:
            Extracted text
        """
        if not TesseractOCR.is_available():
            logger.warning("Tesseract not available")
            return ""

        try:
            import pytesseract
            from PIL import Image

            # Open image
            image = Image.open(image_path)

            # Extract text
            text = pytesseract.image_to_string(image, lang=lang)

            return text
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return ""

    @staticmethod
    def extract_text_with_confidence(
        image_path: str, lang: str = "eng"
    ) -> List[OCRBox]:
        """
        Extract text with confidence scores and bounding boxes.

        Args:
            image_path: Path to image file
            lang: Language code

        Returns:
            List of OCRBox objects
        """
        if not TesseractOCR.is_available():
            logger.warning("Tesseract not available")
            return []

        try:
            import pytesseract
            from PIL import Image

            # Open image
            image = Image.open(image_path)

            # Get detailed data
            data = pytesseract.image_to_data(image, lang=lang, output_type="dict")

            boxes: List[OCRBox] = []
            for i in range(len(data["text"])):
                text = data["text"][i].strip()
                if text:
                    confidence = int(data["conf"][i])
                    if confidence > 0:
                        box = OCRBox(
                            text=text,
                            confidence=confidence / 100.0,
                            x=data["left"][i],
                            y=data["top"][i],
                            width=data["width"][i],
                            height=data["height"][i],
                        )
                        boxes.append(box)

            return boxes
        except Exception as e:
            logger.error(f"Error extracting text with confidence: {e}")
            return []

    @staticmethod
    def extract_tables_from_image(
        image_path: str, lang: str = "eng"
    ) -> List[Dict[str, Any]]:
        """
        Extract tables from image.

        Args:
            image_path: Path to image file
            lang: Language code

        Returns:
            List of detected tables
        """
        # Extract text first
        text = TesseractOCR.extract_text(image_path, lang)

        if not text:
            return []

        # Detect tables from extracted text
        from app.utils.ocr_processor import TableDetectorAdvanced

        return TableDetectorAdvanced.detect_tables_from_text(text)

    @staticmethod
    def preprocess_image(
        image_path: str,
        output_path: str,
        grayscale: bool = True,
        threshold: bool = False,
    ) -> bool:
        """
        Preprocess image for better OCR results.

        Args:
            image_path: Input image path
            output_path: Output image path
            grayscale: Convert to grayscale
            threshold: Apply binary threshold

        Returns:
            True if successful
        """
        try:
            from PIL import Image, ImageOps, ImageEnhance

            # Open image
            image = Image.open(image_path)

            # Convert to grayscale
            if grayscale:
                image = ImageOps.grayscale(image)

            # Apply threshold
            if threshold:
                image = image.point(lambda x: 0 if x < 128 else 255, "1")

            # Enhance contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2)

            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(2)

            # Save
            image.save(output_path)
            return True

        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return False

    @staticmethod
    def detect_text_regions(image_path: str, lang: str = "eng") -> List[Dict[str, Any]]:
        """
        Detect text regions in image.

        Args:
            image_path: Path to image file
            lang: Language code

        Returns:
            List of text regions with bounding boxes
        """
        boxes = TesseractOCR.extract_text_with_confidence(image_path, lang)

        regions: List[Dict[str, Any]] = []
        for box in boxes:
            regions.append(
                {
                    "text": box.text,
                    "confidence": box.confidence,
                    "bbox": box.bbox,
                    "x": box.x,
                    "y": box.y,
                    "width": box.width,
                    "height": box.height,
                }
            )

        return regions


class AdvancedOCRProcessor:
    """Advanced OCR processing with preprocessing and table detection."""

    @staticmethod
    def process_image_advanced(
        image_path: str,
        preprocess: bool = True,
        lang: str = "eng",
        extract_tables: bool = True,
    ) -> Dict[str, Any]:
        """
        Process image with advanced options.

        Args:
            image_path: Path to image file
            preprocess: Whether to preprocess image
            lang: Language code
            extract_tables: Whether to extract tables

        Returns:
            Processing result
        """
        # Preprocess if requested
        tmp_path = None
        if preprocess:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = tmp.name

            try:
                TesseractOCR.preprocess_image(image_path, tmp_path)
                process_path = tmp_path
            except Exception as e:
                logger.error(f"Error preprocessing: {e}")
                process_path = image_path
        else:
            process_path = image_path

        try:
            # Extract text
            text = TesseractOCR.extract_text(process_path, lang)

            # Detect text regions
            regions = TesseractOCR.detect_text_regions(process_path, lang)

            # Extract tables
            tables: List[Dict[str, Any]] = []
            if extract_tables and text:
                from app.utils.ocr_processor import TableDetectorAdvanced

                tables = TableDetectorAdvanced.detect_tables_from_text(text)

            return {
                "success": True,
                "text": text,
                "regions": regions,
                "tables": tables,
                "image_path": image_path,
                "language": lang,
            }

        finally:
            # Clean up temp file
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception as e:
                    logger.error(f"Error removing temp file: {e}")

    @staticmethod
    def batch_process_images(
        image_paths: List[str],
        preprocess: bool = True,
        lang: str = "eng",
        extract_tables: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Process multiple images.

        Args:
            image_paths: List of image paths
            preprocess: Whether to preprocess images
            lang: Language code
            extract_tables: Whether to extract tables

        Returns:
            List of processing results
        """
        results: List[Dict[str, Any]] = []

        for image_path in image_paths:
            try:
                result = AdvancedOCRProcessor.process_image_advanced(
                    image_path,
                    preprocess=preprocess,
                    lang=lang,
                    extract_tables=extract_tables,
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")
                results.append(
                    {"success": False, "error": str(e), "image_path": image_path}
                )

        return results

    @staticmethod
    def export_results_to_excel(
        results: List[Dict[str, Any]], output_file: str
    ) -> bool:
        """
        Export OCR results to Excel.

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
                if result.get("success") and "tables" in result:
                    for table_data in result["tables"]:
                        table = Table(
                            headers=table_data.get("headers", []),
                            rows=table_data.get("rows", []),
                            title=f"{Path(result['image_path']).stem} - {table_data.get('type', 'table')}",
                        )
                        all_tables.append(table)

            if all_tables:
                return ExcelExporter.export(all_tables, output_file)
            else:
                logger.warning("No tables found in results")
                return False

        except Exception as e:
            logger.error(f"Error exporting results: {e}")
            return False
