"""
Test script for TVU PDF Extractor
"""

import sys
from pathlib import Path
from app.utils.tvu_pdf_extractor import TVUPDFExtractor


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_tvu_extractor.py <pdf_file> [--ocr]")
        print("Example: python test_tvu_extractor.py sample.pdf")
        print("Example: python test_tvu_extractor.py sample.pdf --ocr")
        return
    
    pdf_path = sys.argv[1]
    force_ocr = "--ocr" in sys.argv
    
    if not Path(pdf_path).exists():
        print(f"Error: File not found: {pdf_path}")
        return
    
    print(f"{'='*65}")
    print(f"TVU PDF Extractor Test")
    print(f"{'='*65}")
    print(f"File: {pdf_path}")
    print(f"Force OCR: {force_ocr}")
    print(f"{'='*65}\n")
    
    # Test 1: Extract to dict
    print("Test 1: Extract to dict (JSON)")
    print("-" * 65)
    result = TVUPDFExtractor.extract_to_dict(pdf_path, force_ocr=force_ocr)
    
    if result["success"]:
        print(f"✅ Success!")
        print(f"   Total students: {result['summary']['total_students']}")
        print(f"   Total tables: {result['summary']['total_tables']}")
        print(f"   Method: {result['summary']['method']}")
        print(f"   Page count: {result['summary']['page_count']}")
        
        if result['summary'].get('table_types'):
            print(f"   Table types: {result['summary']['table_types']}")
        
        # Show first 3 records
        if result["data"]:
            print(f"\n   First 3 records:")
            for i, record in enumerate(result["data"][:3], 1):
                print(f"   {i}. MSSV: {record.get('MSSV', 'N/A')}, "
                      f"Tên: {record.get('Họ và tên SV', 'N/A')}")
    else:
        print(f"❌ Failed: {result.get('error', 'Unknown error')}")
    
    print()
    
    # Test 2: Extract to Excel
    print("Test 2: Extract to Excel")
    print("-" * 65)
    output_path = str(Path(pdf_path).with_suffix(".xlsx"))
    result = TVUPDFExtractor.extract_to_excel(pdf_path, output_path, force_ocr=force_ocr)
    
    if result["success"]:
        print(f"✅ Success!")
        print(f"   Output file: {result['output_file']}")
        print(f"   Total students: {result['summary']['total_students']}")
        print(f"   Total tables: {result['summary']['total_tables']}")
    else:
        print(f"❌ Failed: {result.get('error', 'Unknown error')}")
    
    print(f"\n{'='*65}")
    print("Test completed!")
    print(f"{'='*65}")


if __name__ == "__main__":
    main()
