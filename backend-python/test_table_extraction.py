"""
Unit tests for table extraction and export module.
"""

import unittest
import os
import tempfile
from app.utils import TableDetector, ExcelExporter, WordExporter, Table


class TestTableDetector(unittest.TestCase):
    """Test table detection"""
    
    def test_detect_pipe_table(self):
        """Test detecting pipe-separated tables"""
        text = """
        | Name | Age |
        |------|-----|
        | John | 30  |
        | Jane | 28  |
        """
        
        tables = TableDetector.detect_tables(text)
        self.assertEqual(len(tables), 1)
        self.assertEqual(tables[0].headers, ['Name', 'Age'])
        self.assertEqual(len(tables[0].rows), 2)
    
    def test_detect_aligned_table(self):
        """Test detecting space-aligned tables"""
        text = """
        Name  Age  City
        John  30   NYC
        Jane  28   LA
        """
        
        tables = TableDetector.detect_tables(text)
        self.assertGreater(len(tables), 0)
    
    def test_detect_multiple_tables(self):
        """Test detecting multiple tables"""
        text = """
        Table 1
        | A | B |
        |---|---|
        | 1 | 2 |
        
        Table 2
        | X | Y |
        |---|---|
        | 3 | 4 |
        """
        
        tables = TableDetector.detect_tables(text)
        self.assertGreaterEqual(len(tables), 1)
    
    def test_detect_table_with_title(self):
        """Test detecting table with title"""
        text = """
        Sales Report
        | Product | Amount |
        |---------|--------|
        | Widget  | 100    |
        """
        
        tables = TableDetector.detect_tables(text)
        if tables:
            self.assertIsNotNone(tables[0].title)
    
    def test_empty_content(self):
        """Test with empty content"""
        tables = TableDetector.detect_tables("")
        self.assertEqual(len(tables), 0)
    
    def test_no_tables(self):
        """Test with content without tables"""
        text = "This is just plain text without any tables."
        tables = TableDetector.detect_tables(text)
        self.assertEqual(len(tables), 0)


class TestExcelExporter(unittest.TestCase):
    """Test Excel export"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up"""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_export_single_table(self):
        """Test exporting single table"""
        table = Table(
            headers=['Name', 'Age'],
            rows=[['John', '30'], ['Jane', '28']],
            title='People'
        )
        
        output_file = os.path.join(self.temp_dir, 'test.xlsx')
        success = ExcelExporter.export([table], output_file)
        
        self.assertTrue(success)
        self.assertTrue(os.path.exists(output_file))
        self.assertGreater(os.path.getsize(output_file), 0)
    
    def test_export_multiple_tables(self):
        """Test exporting multiple tables"""
        tables = [
            Table(headers=['A', 'B'], rows=[['1', '2']], title='Table 1'),
            Table(headers=['X', 'Y'], rows=[['3', '4']], title='Table 2')
        ]
        
        output_file = os.path.join(self.temp_dir, 'test.xlsx')
        success = ExcelExporter.export(tables, output_file)
        
        self.assertTrue(success)
        self.assertTrue(os.path.exists(output_file))
    
    def test_export_empty_table(self):
        """Test exporting empty table"""
        table = Table(headers=['A', 'B'], rows=[])
        
        output_file = os.path.join(self.temp_dir, 'test.xlsx')
        success = ExcelExporter.export([table], output_file)
        
        self.assertTrue(success)
    
    def test_export_special_characters(self):
        """Test exporting table with special characters"""
        table = Table(
            headers=['Name', 'Note'],
            rows=[['John & Jane', '<test>'], ['Bob', 'A & B']],
            title='Special & Characters'
        )
        
        output_file = os.path.join(self.temp_dir, 'test.xlsx')
        success = ExcelExporter.export([table], output_file)
        
        self.assertTrue(success)


class TestWordExporter(unittest.TestCase):
    """Test Word export"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up"""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_export_single_table(self):
        """Test exporting single table"""
        table = Table(
            headers=['Name', 'Age'],
            rows=[['John', '30'], ['Jane', '28']],
            title='People'
        )
        
        output_file = os.path.join(self.temp_dir, 'test.docx')
        success = WordExporter.export([table], output_file)
        
        self.assertTrue(success)
        self.assertTrue(os.path.exists(output_file))
        self.assertGreater(os.path.getsize(output_file), 0)
    
    def test_export_multiple_tables(self):
        """Test exporting multiple tables"""
        tables = [
            Table(headers=['A', 'B'], rows=[['1', '2']], title='Table 1'),
            Table(headers=['X', 'Y'], rows=[['3', '4']], title='Table 2')
        ]
        
        output_file = os.path.join(self.temp_dir, 'test.docx')
        success = WordExporter.export(tables, output_file)
        
        self.assertTrue(success)
        self.assertTrue(os.path.exists(output_file))
    
    def test_export_special_characters(self):
        """Test exporting table with special characters"""
        table = Table(
            headers=['Name', 'Note'],
            rows=[['John & Jane', '<test>'], ['Bob', 'A & B']],
            title='Special & Characters'
        )
        
        output_file = os.path.join(self.temp_dir, 'test.docx')
        success = WordExporter.export([table], output_file)
        
        self.assertTrue(success)


class TestTableObject(unittest.TestCase):
    """Test Table object"""
    
    def test_table_to_dict(self):
        """Test converting table to dictionary"""
        table = Table(
            headers=['A', 'B'],
            rows=[['1', '2']],
            title='Test'
        )
        
        data = table.to_dict()
        self.assertEqual(data['title'], 'Test')
        self.assertEqual(data['headers'], ['A', 'B'])
        self.assertEqual(data['rows'], [['1', '2']])
    
    def test_table_without_title(self):
        """Test table without title"""
        table = Table(headers=['A', 'B'], rows=[['1', '2']])
        
        data = table.to_dict()
        self.assertIsNone(data['title'])


class TestIntegration(unittest.TestCase):
    """Integration tests"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up"""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_detect_and_export_excel(self):
        """Test detecting tables and exporting to Excel"""
        text = """
        Sales Report
        | Product | Q1 | Q2 |
        |---------|-----|-----|
        | Widget  | 100 | 120 |
        | Gadget  | 80  | 90  |
        """
        
        tables = TableDetector.detect_tables(text)
        self.assertGreater(len(tables), 0)
        
        output_file = os.path.join(self.temp_dir, 'report.xlsx')
        success = ExcelExporter.export(tables, output_file)
        
        self.assertTrue(success)
        self.assertTrue(os.path.exists(output_file))
    
    def test_detect_and_export_word(self):
        """Test detecting tables and exporting to Word"""
        text = """
        Employee Directory
        | Name | Department |
        |------|------------|
        | John | Sales      |
        | Jane | IT         |
        """
        
        tables = TableDetector.detect_tables(text)
        self.assertGreater(len(tables), 0)
        
        output_file = os.path.join(self.temp_dir, 'directory.docx')
        success = WordExporter.export(tables, output_file)
        
        self.assertTrue(success)
        self.assertTrue(os.path.exists(output_file))


if __name__ == '__main__':
    unittest.main()
