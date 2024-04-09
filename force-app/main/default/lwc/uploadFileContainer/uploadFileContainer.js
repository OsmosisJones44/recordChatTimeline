import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from 'lightning/navigation';
// import { refreshApex } from "@salesforce/apex";
// import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getDocumentsById from "@salesforce/apex/contentManager.getDocumentsById";

export default class UploadFileContainer extends NavigationMixin(LightningElement) {
    loaded = false;
    @track fileList;
    @api recordId;
    @api thumbnailSize = 'THUMB240BY180';
    @track files = [];
    fids = '';
    // get acceptedFormats() {
    //   return [".pdf", ".png", ".jpg", ".jpeg"];
    // }

    // @wire(getFileVersions, { recordId: "$recordId" })
    // fileResponse(value) {
    //     this.wiredActivities = value;
    //     const { data, error } = value;
    //     this.fileList = "";
    //     this.files = [];
    //     if (data) {
    //         this.fileList = data;
    //         for (let i = 0; i < this.fileList.length; i++) {
    //             let file = {
    //                 Id: this.fileList[i].Id,
    //                 Title: this.fileList[i].Title,
    //                 Extension: this.fileList[i].FileExtension,
    //                 ContentDocumentId: this.fileList[i].ContentDocumentId,
    //                 ContentDocument: this.fileList[i].ContentDocument,
    //                 CreatedDate: this.fileList[i].CreatedDate,
    //                 thumbnailFileCard:
    //                     "/sfc/servlet.shepherd/version/renditionDownload?rendition="+this.thumbnailSize+"&versionId=" +
    //                     this.fileList[i].Id +
    //                     "&operationContext=CHATTER&contentId=" +
    //                     this.fileList[i].ContentDocumentId
    //             };
    //             if (this.fids !== '') this.fids += ',';
    //             this.fids += this.fileList[i].ContentDocumentId;
    //             this.files.push(file);
    //         }
    //         this.loaded = true;
    //     } else if (error) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: "Error loading Files",
    //                 message: error.body.message,
    //                 variant: "error"
    //             })
    //         );
    //     }
    // }
    // async handleUploadFinished(event) {
    //     const uploadedFiles = event.detail.files;
    //     this.dispatchEvent(
    //         new ShowToastEvent({
    //             title: "Success!",
    //             message: uploadedFiles.length + " Files Uploaded Successfully.",
    //             variant: "success"
    //         })
    //     );
    //     await refreshApex(this.wiredActivities);
    // }

    // connectedCallback(){
    //     if(this.documentIds.length > 0){
    //         this.getFiles();
    //     } else {
    //     }
    // }

    getFiles(contentDocumentIds){
        getDocumentsById({ documentIds: contentDocumentIds })
        .then(value =>{
            this.wiredActivities = value;
            this.fileList = "";
            this.files = [];
            if (this.wiredActivities) {
                this.fileList = this.wiredActivities;
                for (let i = 0; i < this.fileList.length; i++) {
                    let file = {
                        Id: this.fileList[i].LatestPublishedVersionId,
                        Title: this.fileList[i].Title,
                        Extension: this.fileList[i].FileExtension,
                        ContentDocumentId: this.fileList[i].Id,
                        CreatedDate: this.fileList[i].ContentModifiedDate,
                        thumbnailFileCard:
                            "/sfc/servlet.shepherd/version/renditionDownload?rendition="+this.thumbnailSize+"&versionId=" +
                            this.fileList[i].LatestPublishedVersionId +
                            "&operationContext=CHATTER&contentId=" +
                            this.fileList[i].Id
                    };
                    if (this.fids !== '') this.fids += ',';
                    this.fids += this.fileList[i].Id;
                    this.files.push(file);
                }
                this.loaded = true;
            }
        }).catch(error =>{
            console.error(error);
        });
    }

    @api
    refresh(contentDocumentIds) {
        console.log('upload file chat');
        this.getFiles(contentDocumentIds);

    }
    openPreview(event) {
        let elementId = event.detail.Id;
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                selectedRecordId: elementId,
                recordIds: this.fids
            }
        })
    }
}