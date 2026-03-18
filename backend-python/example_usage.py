"""
Example usage of the table extraction and export module.
This demonstrates how to use the table extractor without external APIs.
"""

from app.utils import TableDetector, ExcelExporter, WordExporter, FileProcessor

# Example 1: Detect tables from text
def example_detect_tables():
    """Example: Detect tables in text content"""
    
    text_content = """
    Student Performance Report
    
    | Name | Math | English | Science |
    |------|------|---------|---------|
    | John | 85   | 90      | 88      |
    | Jane | 92   | 88      | 95      |
    | Bob  | 78   | 82      | 80      |
    
    Department Statistics
    
    Department  Employees  Budget
    Sales       45         500000
    Marketing   30         300000
    IT          60         800000
    """
    
    tables = TableDetector.detect_tables(text_content)
    
    print(f"Found {len(tables)} tables:")
    for i, table in enumerate(tables, 1):
        print(f"\nTable {i}:")
        if table.title:
            print(f"  Title: {table.title}")
        print(f"  Headers: {table.headers}")
        print(f"  Rows: {len(table.rows)}")
        for row in table.rows:
            print(f"    {row}")


# Example 2: Export to Excel
def example_export_excel():
    """Example: Export tables to Excel"""
    
    text_content = """
    Sales Report Q1 2024
    
    | Product | Jan | Feb | Mar |
    |---------|-----|-----|-----|
    | Widget A | 100 | 120 | 150 |
    | Widget B | 80  | 90  | 110 |
    | Widget C | 60  | 70  | 85  |
    """
    
    tables = TableDetector.detect_tables(text_content)
    
    if tables:
        success = ExcelExporter.export(tables, 'output_report.xlsx')
        if success:
            print("✓ Excel file created: output_report.xlsx")
        else:
            print("✗ Failed to create Excel file")


# Example 3: Export to Word
def example_export_word():
    """Example: Export tables to Word"""
    
    text_content = """
    Employee Directory
    
    | ID | Name | Department | Email |
    |----|------|------------|-------|
    | 1  | Alice | HR | alice@company.com |
    | 2  | Bob | IT | bob@company.com |
    | 3  | Carol | Finance | carol@company.com |
    """
    
    tables = TableDetector.detect_tables(text_content)
    
    if tables:
        success = WordExporter.export(tables, 'output_directory.docx')
        if success:
            print("✓ Word file created: output_directory.docx")
        else:
            print("✗ Failed to create Word file")


# Example 4: Process file
def example_process_file():
    """Example: Process a file and export"""
    
    # Create a sample file
    sample_content = """
    Quarterly Revenue Report
    
    | Quarter | Revenue | Expenses | Profit |
    |---------|---------|----------|--------|
    | Q1 | 100000 | 60000 | 40000 |
    | Q2 | 120000 | 70000 | 50000 |
    | Q3 | 150000 | 85000 | 65000 |
    | Q4 | 180000 | 100000 | 80000 |
    """
    
    # Write sample file
    with open('sample_report.txt', 'w') as f:
        f.write(sample_content)
    
    # Process and export to Excel
    success = FileProcessor.process_file('sample_report.txt', 'excel', 'revenue_report.xlsx')
    if success:
        print("✓ File processed and exported to Excel")
    
    # Process and export to Word
    success = FileProcessor.process_file('sample_report.txt', 'word', 'revenue_report.docx')
    if success:
        print("✓ File processed and exported to Word")


if __name__ == '__main__':
    print("=" * 50)
    print("Table Extraction Examples")
    print("=" * 50)
    
    print("\n1. Detecting tables:")
    print("-" * 50)
    example_detect_tables()
    
    print("\n2. Exporting to Excel:")
    print("-" * 50)
    example_export_excel()
    
    print("\n3. Exporting to Word:")
    print("-" * 50)
    example_export_word()
    
    print("\n4. Processing file:")
    print("-" * 50)
    example_process_file()
