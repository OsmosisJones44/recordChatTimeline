import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import initFiles from "@salesforce/apex/contentManager.initFiles";
import getReadUsers from '@salesforce/apex/BirthdayController.getReadUsers';
import queryFiles from "@salesforce/apex/contentManager.queryFiles";
import loadFiles from "@salesforce/apex/contentManager.loadFiles";
import USER_ID from '@salesforce/user/Id';
import MESSAGE_OBJECT from '@salesforce/schema/Ticket_Message__c';
import MESSAGE_FIELD from '@salesforce/schema/Ticket_Message__c.Message__c';
import OWNER_FIELD from '@salesforce/schema/Ticket_Message__c.OwnerId';
import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Parent_Record_Id__c';
import PARENTID_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
import CLOSED_FIELD from '@salesforce/schema/Ticket_Message__c.Closed_Thread__c';
import STATUS_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
import HDOWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import HDMESSAGE_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import HIDDEN_FIELD from '@salesforce/schema/Ticket_Message__c.Hidden__c';
import DOC_FIELD from '@salesforce/schema/Ticket_Message__c.DocumentId__c';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class ThreadTile extends NavigationMixin(LightningElement) {
    @api ticketMsg;
    @api recordId;
    @api mainArea;
    // @api ticketUsers = [];
    @api customRecipients;
    @api showThread = false;
    @api threadBox = "slds-m-left_xx-large slds-box slds-box_xx-small";
    @api timelineContainerClass = 'threadTimelineClass';
    userId = USER_ID;
    closedThread;
    isLoading = false;
    disableButton;
    curUser;
    adminMode;
    curName;
    error;
    ticketMessageId;
    ticketUsers;
    ticketSeenUsers;
    ticketMsg;
    moreLoaded = true;
    loaded = false;
    attachments = {};
    totalFiles;
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

    @wire(getReadUsers, { ticketMessageId: '$recordId' })
    userSetup(result) {
        this.ticketSeenUsers = result;
        const { data, error } = result;
        if (data) {
            this.ticketUsers = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.ticketUsers = undefined;
            this.error = error;
            console.error(JSON.stringify(error));
        } else {
            this.error = undefined;
            this.ticketUsers = undefined;
        }
        this.lastSavedUserData = this.ticketUsers;
        this.isLoading = false;
    };

    connectedCallback() {
        this.closedThread = this.ticketMsg.Closed_Thread__c;
        this.runGetUser();    
    }

    runGetUser(){
        getCurUser({userId:this.userId})
        .then((result) => {
            console.log(JSON.stringify(result));
            this.curName = result.Name;
            this.adminMode = result.Help_Desk_Admin__c;
            console.log(this.adminMode);
            this.error = undefined;
        })
        .catch((error) => {
            this.error = error;
            this.curUser = undefined;
        });
    }
    handleOpen() {
        const parentId = this.ticketMsg.Parent_Record_Id__c;
        console.log("ParentId: "+parentId)
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: parentId,
                actionName: 'view'
            }
        });
    }
    @api
    showInfoTab() {
        const el = this.template.querySelector('lightning-tabset[data-id="threadTabs"]');
        el.activeTabValue = 'info';
    }
    handleResolve(event) {
        event.stopPropagation();
        event.preventDefault();
        this.isLoading = true;
        this.disableButton = true;
        const fields = {};
        fields[PARENTID_FIELD.fieldApiName] = this.ticketMsg.Id;
        fields[CLOSED_FIELD.fieldApiName] = true;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isLoading = false;
                this.closedThread = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Thread Resolved',
                        variant: 'success'
                    })
                );
                this.disableButton = false;
                this.handleRefresh();
            })
            .catch(error => {
                console.log(JSON.stringify(error));
                this.isLoading = false;
                this.disableButton = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Resolving Message Thread',
                        message: 'Screenshot Me and send to your Salesoforce Administrator',
                        variant: 'error'
                    })
                );
            });
    }
    handleReopen(event) {
        event.stopPropagation();
        event.preventDefault();
        this.isLoading = true;
        this.disableButton = true;
        const fields = {};
        fields[PARENTID_FIELD.fieldApiName] = this.ticketMsg.Id;
        fields[CLOSED_FIELD.fieldApiName] = false;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isLoading = false;
                this.disableButton = false;
                this.closedThread = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Thread Re-Opened',
                        variant: 'success'
                    })
                );
                this.handleRefresh();
            })
            .catch(error => {
                this.isLoading = false;
                this.disableButton = false;
                console.log(JSON.stringify(error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Re-Opening Message Thread',
                        message: 'Screenshot Me and send to your Salesoforce Administrator',
                        variant: 'error'
                    })
                );
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
    handleRefresh(){
        const selectEvent = new CustomEvent('refresh', {
            detail: this.ticketMsg.Id
        });
        this.dispatchEvent(selectEvent);  
    }
    handleUserChange(event) {
        this.userNameValue = event.target.value;
        console.log(this.userNameValue);
    }
    handleAddUser() {
        console.log('Testing Add user');
        // event.preventDefault();
        // event.stopPropagation();
        if (this.userNameValue) {
            console.log('TicketUsers: '+JSON.stringify(this.ticketUsers));
            // this.ticketUsers.forEach(el => {
            //     this.recipients.push(el.Id);
            // });
            // console.log('Recipients: '+this.recipients);
            // this.recipients = [this.userNameValue];
            this.isLoading = true;
            if (this.ticketUsers.some(el => el.Id === this.userNameValue)) {
                this.template.querySelector('lightning-input-field[data-id="userUpdate"]').value = null;
                this.isLoading = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Adding User',
                        message: 'User Already Being Notified about Updates in Thread - Contact your SF Admin with any Questions',
                        variant: 'error',
                    }),
                );
            } else {
                const fields = {};
                fields[HDOWNER_FIELD.fieldApiName] = this.userNameValue;
                fields[HDMESSAGE_FIELD.fieldApiName] = this.ticketMsg.Id;
                fields[READ_FIELD.fieldApiName] = true;
                const recordInput = { apiName: STATUS_OBJECT.objectApiName, fields };
                createRecord(recordInput)
                    .then(result => {
                        console.log(JSON.stringify(result));
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Member Successfully Added',
                                message: 'Please Refresh if the added member is not showing within the "Notified" tab of the Thread Pop-Up',
                                variant: 'success',
                            }),
                        );
                        
                        this.template.querySelector('lightning-input-field[data-id="userUpdate"]').value = null;
                        this.isLoading = false;
                        return refreshApex(this.ticketSeenUsers);
                    })
                    .catch(error => {
                        console.log(JSON.stringify(error));
                        this.isLoading = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error Creating Custom Notifcations',
                                message: 'Contact your Salesforce Admin',
                                variant: 'error',
                            }),
                        );
                    });
            }
        } else {
            this.isLoading = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Adding User',
                    message: 'Please Select a User Below Clicking "Add"',
                    variant: 'error',
                }),
            );
        }
    }
    sendCustomNotifications(result) {
        console.log(result);
        console.log(this.customRecipients);
        if (this.customRecipients.length != 0) {
            this.customRecipients.forEach(rec => {
                const fields = {};
                fields[HDMESSAGE_FIELD.fieldApiName] = result.id;
                fields[HDOWNER_FIELD.fieldApiName] = rec;
                const recordInput = { apiName: STATUS_OBJECT.objectApiName, fields };
                createRecord(recordInput)
                    .then(result => {
                        console.log('Notification Sent');
                    })
                    .catch(error => {
                        console.log(JSON.stringify(error));
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error Creating Custom Notifcations',
                                message: 'Contact your Salesforce Admin',
                                variant: 'error',
                            }),
                        );
                    });
            })
        }
    }    
    loadMore(){
        this.moreLoaded = false;
        var self = this;
        loadFiles({ 
            recordId: this.this.ticketMsg.Parent_Record_Id__c, 
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
        let elementId = event.currentTarget.dataset.id;
        const eventElement = event.currentTarget;
        eventElement.classList.remove('slds-hide');
        let dataId = 'lightning-icon[data-id="' + elementId + '"]';
        this.template.querySelector(dataId).classList.add('slds-hide');
    }
    calculateFileAttributes(item){
        let imageExtensions = ['png','jpg','gif'];
        let supportedIconExtensions = ['ai','attachment','audio','box_notes','csv','eps','excel','exe','flash','folder','gdoc','gdocs','gform','gpres','gsheet','html','image','keynote','library_folder','link','mp4','overlay','pack','pages','pdf','ppt','psd','quip_doc','quip_sheet','quip_slide','rtf','slide','stypi','txt','unknown','video','visio','webex','word','xml','zip'];
        item.src = this.documentForceUrl + '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB120BY90&versionId=' + item.ContentDocument.LatestPublishedVersionId;
        item.size = this.formatBytes(item.ContentDocument.ContentSize, 2);
        item.icon = 'doctype:attachment';
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
        initFiles({ 
            recordId: this.ticketMsg.Parent_Record_Id__c, 
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
                this.defaultNbFileDisplayed = 6;
            }
            if (this.limitRows === undefined){
                this.limitRows = 3;
            }
            this.offset = this.defaultNbFileDisplayed;
            if(result.totalCount > this.defaultNbFileDisplayed){
                nbFiles = this.defaultNbFileDisplayed + '+';
            }
            this.title = 'Files (' + nbFiles + ')';
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
            const fields = {};
            //this.messageValue = this.curName + ' just posted a New File<a href="' + baseUrl+'sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId='+file.contentVersionId + '">file</a>';
            this.messageValue = this.curName + ' has just attached a New File to this ticket';
            fields[MESSAGE_FIELD.fieldApiName] = this.messageValue;
            fields[OWNER_FIELD.fieldApiName] = this.userId;
            fields[PARENT_FIELD.fieldApiName] = this.this.ticketMsg.Parent_Record_Id__c;
            fields[DOC_FIELD.fieldApiName] = file.documentId;
            const recordInput = { apiName: MESSAGE_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Timeline Updated',
                            variant: 'success',
                        }),
                    );
                    refreshApex(this.timelinePosts)
                    .then(() => {
                        this.messageValue = '';
                        this.scrollToBottom();                
                    })
                })
                .catch(error => {
                    //console.log(JSON.stringify(error));
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error Creating Record',
                            message: 'Screenshot this and Contact your Salesforce Admin: ' + error.body.message ,
                            variant: 'error',
                        }),
                    );
                });
        }
        queryFiles({ 
            recordId: this.this.ticketMsg.Parent_Record_Id__c, 
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