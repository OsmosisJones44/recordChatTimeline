import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import initFiles from "@salesforce/apex/contentManager.initFiles";
import queryFiles from "@salesforce/apex/contentManager.queryFiles";
import loadFiles from "@salesforce/apex/contentManager.loadFiles";
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import USER_ID from '@salesforce/user/Id';
// import MESSAGE_OBJECT from '@salesforce/schema/Ticket_Message__c';
// import MESSAGE_FIELD from '@salesforce/schema/Ticket_Message__c.Message__c';
// import OWNER_FIELD from '@salesforce/schema/Ticket_Message__c.OwnerId';
// import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Parent_Record_Id__c';
// import PARENTID_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
// import HIDDEN_FIELD from '@salesforce/schema/Ticket_Message__c.Hidden__c';
// import DOC_FIELD from '@salesforce/schema/Ticket_Message__c.DocumentId__c';
// import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { refreshApex } from '@salesforce/apex';

export default class RecordFileContainer extends NavigationMixin(LightningElement) {
    @api recordId;
    @api titlePrefix = '';
    @api defaultNbFileDisplayed;
    @api limitRows;
    @api totalFiles;
    error;
    curName;
    curUser;
    iconName = "utility:file";
    isLoading = false;
    userId = USER_ID;
    moreLoaded = true;
    loaded = false;
    attachments = {};
    fids = '';
    tempIds = [];
    uploadedFiles = []; 
    tempTicketUsers = [];
    file; 
    fileContents; 
    fileReader; 
    content; 
    fileName;    
    fileName = '';
    filesUploaded = [];
    moreRecords;
    offset=0;
    sortIcon = 'utility:arrowdown';
    sortOrder = 'DESC';
    sortField = 'ContentDocument.CreatedDate';
    disabled = true;
    filters = [
        {
            'id' : 'gt100KB',
            'label' : '>= 100 KB',
            'checked' : true
        },
        {
            'id' : 'lt100KBgt10KB',
            'label' : '< 100 KB and > 10 KB',
            'checked' : true
        },
        {
            'id' : 'lt10KB',
            'label' : '<= 10 KB',
            'checked' : true
        }
    ];
    formats = [
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'link',
        'image',
        'table',
        'header',
    ];
    title;
    conditions;
    documentForceUrl;
    get DateSorted() {
        return this.sortField == 'ContentDocument.CreatedDate';
    }
    get NameSorted() {
        return this.sortField == 'ContentDocument.Title';
    }
    get SizeSorted() {
        return this.sortField == 'ContentDocument.ContentSize';
    }
    get noRecords(){
        return this.totalFiles == 0;
    }

    connectedCallback(){
        this.initRecords();
        this.runGetUser();
    }
    runGetUser(){
        getCurUser({userId:this.userId})
        .then((result) => {
            //console.log(JSON.stringify(result));
            this.curUser = result;
            this.curName = result.Name;
            this.error = undefined;
        })
        .catch((error) => {
            this.error = error;
            this.curUser = undefined;
        });
    }    
    toggleSortOrder(){
        if(this.sortOrder == 'ASC'){
            this.sortOrder = 'DESC';
            this.sortIcon = 'utility:arrowdown';
        }else{
            this.sortOrder = 'ASC';
            this.sortIcon = 'utility:arrowup';
        }
    }
    openPreview(event){
        let elementId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state : {
                selectedRecordId: elementId,
                recordIds: this.fids
            }
        })
    } 
    loadMore(){
        this.moreLoaded = false;
        var self = this;
        loadFiles({ 
            recordId: this.recordId, 
            filters: this.conditions, 
            defaultLimit: this.defaultNbFileDisplayed, 
            offset: this.offset, 
            sortField: this.sortField, 
            sortOrder: this.sortOrder 
        })
        .then(result => {
            for(var cdl of result){
                self.attachments.push(self.calculateFileAttributes(cdl));
                self.fileCreated = true;
                if (this.fids != '') this.fids += ',';
                this.fids += cdl.ContentDocumentId;
            }
            self.updateCounters(result.length);
            self.moreLoaded = true;
        });
    }
    showNotification(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    updateCounters(recordCount){
        this.offset += recordCount;
        this.moreRecords = this.offset < this.totalFiles;
    }    
    formatBytes(bytes,decimals) {
        if(bytes == 0) return '0 Bytes';
        var k = 1024,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }    
    handleLoad(event){
        console.log("handleLoad: "+JSON.stringify(event.currentTarget));
        let elementId = event.currentTarget.dataset.id;
        const eventElement = event.currentTarget;
        eventElement.classList.remove('slds-hide');
        let dataId = 'lightning-icon[data-id="' + elementId + '"]';
        this.template.querySelector(dataId).classList.add('slds-hide');
    }
    calculateFileAttributes(item){
        let imageExtensions = ['png','jpg','gif'];
        let supportedIconExtensions = ['ai','attachment','audio','box_notes','csv','eps','excel','exe','flash','folder','gdoc','gdocs','gform','gpres','gsheet','html','image','keynote','library_folder','link','mp4','overlay','pack','pages','pdf','ppt','psd','quip_doc','quip_sheet','quip_slide','rtf','slide','stypi','txt','unknown','video','visio','webex','word','xml','zip'];
        item.src = "/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB240BY180&versionId=" + item.ContentDocument.LatestPublishedVersionId + "&operationContext=CHATTER&contentId=" + item.ContentDocumentId;
        // /sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=
        console.log(item.src);
        item.size = this.formatBytes(item.ContentDocument.ContentSize, 2);
        item.icon = 'doctype:attachment';
        this.createdDateParent = new Date(item.ContentDocument.CreatedDate);
        let fileType = item.ContentDocument.FileType.toLowerCase();
        if(imageExtensions.includes(fileType)){
            item.icon = 'doctype:image';
        }else{
            if(supportedIconExtensions.includes(fileType)){
                item.icon = 'doctype:' + fileType;
            }
        }
        return item;
    }
    initRecords() {
        this.isLoading = true;
        initFiles({ 
            recordId: this.recordId, 
            filters: this.conditions, 
            defaultLimit: this.defaultNbFileDisplayed, 
            sortField: this.sortField, 
            sortOrder: this.sortOrder 
        })
        .then(result => {
            this.fids = '';
            let listAttachments = new Array();
            let contentDocumentLinks = result.contentDocumentLinks;
            this.documentForceUrl = result.documentForceUrl;
            for(var item of contentDocumentLinks){
                listAttachments.push(this.calculateFileAttributes(item));
                if (this.fids != '') this.fids += ',';
                this.fids += item.ContentDocumentId;
            }
            this.attachments = listAttachments;
            this.totalFiles = result.totalCount;
            this.moreRecords = result.totalCount > 3 ? true : false;
            let nbFiles = listAttachments.length;
            if (this.defaultNbFileDisplayed === undefined){
                this.defaultNbFileDisplayed = 3;
            }
            if (this.limitRows === undefined){
                this.limitRows = 3;
            }
            this.offset = this.defaultNbFileDisplayed;
            if(result.totalCount > this.defaultNbFileDisplayed){
                nbFiles = this.defaultNbFileDisplayed + '+';
            }
            this.title = this.titlePrefix + 'Files (' + nbFiles + ')';
            this.disabled = false;
            this.loaded = true;
        })
        .catch(error => {
            this.showNotification("", "Error", "error");
        }).finally(() => {
            this.isLoading = false;
        });
    }    
    handleFilesChange(event) {
        if(event.target.files.length > 0) {
            this.filesUploaded = event.target.files;

            for(let item in filesUploaded){
                attachments.push(item);
            }
            for(let i = 0; filesUploaded.length; i++){
                this.fileName = event.target.files[i].name;
                this.fileSize = this.formatBytes(event.target.files[i].size,2);                
            }
        }
    }
    getBaseUrl(){
        let baseUrl = 'https://'+location.host+'/';
        return baseUrl;
    }
    handleUploadFinished(event) {
        var self = this;
        //let baseUrl = this.getBaseUrl();
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;
        var contentDocumentIds = new Array();
        for(var file of uploadedFiles){
            console.log(JSON.stringify(file));
            contentDocumentIds.push(file.documentId);
            // const fields = {};
            // //this.messageValue = this.curName + ' just posted a New File<a href="' + baseUrl+'sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId='+file.contentVersionId + '">file</a>';
            // this.messageValue = this.curName + ' has just attached a New File to this ticket';
            // fields[MESSAGE_FIELD.fieldApiName] = this.messageValue;
            // fields[OWNER_FIELD.fieldApiName] = this.userId;
            // fields[PARENT_FIELD.fieldApiName] = this.this.ticketMsg.Parent_Record_Id__c;
            // fields[DOC_FIELD.fieldApiName] = file.documentId;
            // const recordInput = { apiName: MESSAGE_OBJECT.objectApiName, fields };
            // createRecord(recordInput)
            //     .then(() => {
            //         this.dispatchEvent(
            //             new ShowToastEvent({
            //                 title: 'Success',
            //                 message: 'Timeline Updated',
            //                 variant: 'success',
            //             }),
            //         );
            //         refreshApex(this.timelinePosts)
            //         .then(() => {
            //             this.messageValue = '';
            //             this.scrollToBottom();                
            //         })
            //     })
            //     .catch(error => {
            //         //console.log(JSON.stringify(error));
            //         this.dispatchEvent(
            //             new ShowToastEvent({
            //                 title: 'Error Creating Record',
            //                 message: 'Screenshot this and Contact your Salesforce Admin: ' + error.body.message ,
            //                 variant: 'error',
            //             }),
            //         );
            //     });
        }
        queryFiles({ 
            recordId: this.recordId, 
            contentDocumentIds: contentDocumentIds 
        })
        .then(result => {
            for(var cdl of result){
                self.attachments.unshift(self.calculateFileAttributes(cdl));
                self.fileCreated = true;
                this.fids = cdl.ContentDocumentId + (this.fids=='' ? '' : ',' + this.fids);
            }
            self.updateCounters(result.length);
            this.totalFiles += result.length;
            this.initRecords();
        });
    }   
}