import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class UploadFileTile extends NavigationMixin(LightningElement) {
    @api file;
    @api recordId;
    @api thumbnail;
  
    get title(){
        return this.sanitizedTitle + "." + this.file.Extension
    }

    get sanitizedTitle() {
      if (!this.file || !this.file.Title) {
          return 'No Title';
      }
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      const lowerTitle = this.file.Title.toLowerCase();
      for (const ext of imageExtensions) {
          if (lowerTitle.endsWith(ext)) {
              return this.file.Title.slice(0, -ext.length);
          }
      }
      return this.file.Title;
  }
    
    get iconName() {
      if (this.file.Extension) {
        if (this.file.Extension === "pdf") {
          return "doctype:pdf";
        }
        if (this.file.Extension === "ppt") {
          return "doctype:ppt";
        }
        if (this.file.Extension === "xls") {
          return "doctype:excel";
        }
        if (this.file.Extension === "csv") {
          return "doctype:csv";
        }
        if (this.file.Extension === "txt") {
          return "doctype:txt";
        }
        if (this.file.Extension === "xml") {
          return "doctype:xml";
        }
        if (this.file.Extension === "doc") {
          return "doctype:word";
        }
        if (this.file.Extension === "zip") {
          return "doctype:zip";
        }
        if (this.file.Extension === "rtf") {
          return "doctype:rtf";
        }
        if (this.file.Extension === "psd") {
          return "doctype:psd";
        }
        if (this.file.Extension === "html") {
          return "doctype:html";
        }
        if (this.file.Extension === "gdoc") {
          return "doctype:gdoc";
        }
      }
      return "doctype:image";
    }

    openPreview(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('preview', {
            detail: {
                Id: this.file.ContentDocumentId
            }
        });
        this.dispatchEvent(selectEvent);  
    } 
}