"""
Example usage of OCR and table extraction.
"""

from app.utils.ocr_tesseract import TesseractOCR, AdvancedOCRProcessor
from app.utils.ocr_processor import OCRProcessor, TableDetectorAdvanced
from pathlib import Path


def example_1_extract_text():
    """Example 1: Extract text from image"""
    print("=" * 50)
    print("Example 1: Extract Text from Image")
    print("=" * 50)
    
    # Check if Tesseract is available
    if not TesseractOCR.is_available():
        print("Tesseract not available. Install with: pip install pytesseract pillow")
        return
    
    # Extract text
    image_path = 'sample_image.png'
    text = TesseractOCR.extract_text(image_path, lang='eng')
    
    print(f"Extracted text from {image_path}:")
    print(text)
    print()


def example_2_detect_text_regions():
    """Example 2: Detect text regions with bounding boxes"""
    print("=" * 50)
    print("Example 2: Detect Text Regions")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    image_path = 'sample_image.png'
    regions = TesseractOCR.detect_text_regions(image_path, lang='eng')
    
    print(f"Found {len(regions)} text regions:")
    for i, region in enumerate(regions[:5], 1):  # Show first 5
        print(f"\nRegion {i}:")
        print(f"  Text: {region['text']}")
        print(f"  Confidence: {region['confidence']:.2%}")
        print(f"  BBox: {region['bbox']}")
    
    if len(regions) > 5:
        print(f"\n... and {len(regions) - 5} more regions")
    print()


def example_3_extract_tables():
    """Example 3: Extract tables from image"""
    print("=" * 50)
    print("Example 3: Extract Tables from Image")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    image_path = 'sample_table.png'
    tables = TesseractOCR.extract_tables_from_image(image_path, lang='eng')
    
    print(f"Found {len(tables)} tables:")
    for i, table in enumerate(tables, 1):
        print(f"\nTable {i}:")
        print(f"  Type: {table.get('type')}")
        print(f"  Headers: {table.get('headers')}")
        print(f"  Rows: {len(table.get('rows', []))}")
        
        # Show first few rows
        for row in table.get('rows', [])[:3]:
            print(f"    {row}")
    print()


def example_4_preprocess_image():
    """Example 4: Preprocess image for better OCR"""
    print("=" * 50)
    print("Example 4: Preprocess Image")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    input_path = 'sample_image.png'
    output_path = 'sample_image_preprocessed.png'
    
    # Preprocess
    success = TesseractOCR.preprocess_image(
        input_path,
        output_path,
        grayscale=True,
        threshold=True
    )
    
    if success:
        print(f"✓ Image preprocessed: {output_path}")
        
        # Extract text from preprocessed image
        text = TesseractOCR.extract_text(output_path, lang='eng')
        print(f"Text from preprocessed image:\n{text}")
    else:
        print("✗ Failed to preprocess image")
    print()


def example_5_advanced_processing():
    """Example 5: Advanced image processing"""
    print("=" * 50)
    print("Example 5: Advanced Image Processing")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    image_path = 'sample_image.png'
    
    # Process with preprocessing
    result = AdvancedOCRProcessor.process_image_advanced(
        image_path,
        preprocess=True,
        lang='eng',
        extract_tables=True
    )
    
    print(f"Processing result:")
    print(f"  Success: {result.get('success')}")
    print(f"  Text length: {len(result.get('text', ''))}")
    print(f"  Regions found: {len(result.get('regions', []))}")
    print(f"  Tables found: {len(result.get('tables', []))}")
    
    if result.get('tables'):
        print(f"\nFirst table:")
        table = result['tables'][0]
        print(f"  Headers: {table.get('headers')}")
        print(f"  Rows: {len(table.get('rows', []))}")
    print()


def example_6_batch_processing():
    """Example 6: Batch process multiple images"""
    print("=" * 50)
    print("Example 6: Batch Processing")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    # Create sample image paths
    image_paths = [
        'sample_image1.png',
        'sample_image2.png',
        'sample_image3.png'
    ]
    
    # Filter existing files
    existing_paths = [p for p in image_paths if Path(p).exists()]
    
    if not existing_paths:
        print("No sample images found. Create some first.")
        return
    
    # Process batch
    results = AdvancedOCRProcessor.batch_process_images(
        existing_paths,
        preprocess=False,
        lang='eng',
        extract_tables=True
    )
    
    print(f"Processed {len(results)} images:")
    for i, result in enumerate(results, 1):
        print(f"\nImage {i}:")
        print(f"  Success: {result.get('success')}")
        print(f"  Text length: {len(result.get('text', ''))}")
        print(f"  Tables: {len(result.get('tables', []))}")
    print()


def example_7_export_to_excel():
    """Example 7: Export tables to Excel"""
    print("=" * 50)
    print("Example 7: Export to Excel")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    # Create sample image paths
    image_paths = ['sample_table1.png', 'sample_table2.png']
    
    # Filter existing files
    existing_paths = [p for p in image_paths if Path(p).exists()]
    
    if not existing_paths:
        print("No sample images found. Create some first.")
        return
    
    # Process batch
    results = AdvancedOCRProcessor.batch_process_images(
        existing_paths,
        preprocess=False,
        lang='eng',
        extract_tables=True
    )
    
    # Export to Excel
    output_file = 'extracted_tables.xlsx'
    success = AdvancedOCRProcessor.export_results_to_excel(results, output_file)
    
    if success:
        print(f"✓ Tables exported to: {output_file}")
    else:
        print("✗ Failed to export tables")
    print()


def example_8_detect_tables_from_text():
    """Example 8: Detect tables from text"""
    print("=" * 50)
    print("Example 8: Detect Tables from Text")
    print("=" * 50)
    
    # Sample text with tables
    text = """
    Sales Report Q1 2024
    
    | Product | Jan | Feb | Mar |
    |---------|-----|-----|-----|
    | Widget A | 100 | 120 | 150 |
    | Widget B | 80  | 90  | 110 |
    | Widget C | 60  | 70  | 85  |
    
    Department Statistics
    
    Department  Employees  Budget
    Sales       45         500000
    Marketing   30         300000
    IT          60         800000
    """
    
    # Detect tables
    tables = TableDetectorAdvanced.detect_tables_from_text(text)
    
    print(f"Found {len(tables)} tables:")
    for i, table in enumerate(tables, 1):
        print(f"\nTable {i}:")
        print(f"  Type: {table.get('type')}")
        print(f"  Headers: {table.get('headers')}")
        print(f"  Rows: {len(table.get('rows', []))}")
        
        for row in table.get('rows', [])[:2]:
            print(f"    {row}")
    print()


def example_9_vietnamese_ocr():
    """Example 9: OCR with Vietnamese language"""
    print("=" * 50)
    print("Example 9: Vietnamese OCR")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    image_path = 'sample_vietnamese.png'
    
    if not Path(image_path).exists():
        print(f"Sample image not found: {image_path}")
        return
    
    # Extract Vietnamese text
    text = TesseractOCR.extract_text(image_path, lang='vie')
    
    print(f"Extracted Vietnamese text:")
    print(text)
    print()


def example_10_confidence_filtering():
    """Example 10: Filter results by confidence"""
    print("=" * 50)
    print("Example 10: Confidence Filtering")
    print("=" * 50)
    
    if not TesseractOCR.is_available():
        print("Tesseract not available")
        return
    
    image_path = 'sample_image.png'
    
    # Get all regions
    regions = TesseractOCR.detect_text_regions(image_path, lang='eng')
    
    # Filter by confidence
    high_confidence = [r for r in regions if r['confidence'] > 0.9]
    medium_confidence = [r for r in regions if 0.7 <= r['confidence'] <= 0.9]
    low_confidence = [r for r in regions if r['confidence'] < 0.7]
    
    print(f"Total regions: {len(regions)}")
    print(f"High confidence (>0.9): {len(high_confidence)}")
    print(f"Medium confidence (0.7-0.9): {len(medium_confidence)}")
    print(f"Low confidence (<0.7): {len(low_confidence)}")
    
    print(f"\nHigh confidence regions:")
    for region in high_confidence[:5]:
        print(f"  {region['text']} ({region['confidence']:.2%})")
    print()


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("OCR and Table Extraction Examples")
    print("=" * 50 + "\n")
    
    # Check Tesseract availability
    if TesseractOCR.is_available():
        print("✓ Tesseract OCR is available\n")
    else:
        print("✗ Tesseract OCR is not available")
        print("Install with: pip install pytesseract pillow\n")
    
    # Run examples
    try:
        example_1_extract_text()
        example_2_detect_text_regions()
        example_3_extract_tables()
        example_4_preprocess_image()
        example_5_advanced_processing()
        example_6_batch_processing()
        example_7_export_to_excel()
        example_8_detect_tables_from_text()
        example_9_vietnamese_ocr()
        example_10_confidence_filtering()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
