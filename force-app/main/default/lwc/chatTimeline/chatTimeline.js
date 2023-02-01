import { LightningElement, api, wire } from 'lwc';
import getReadUsers from '@salesforce/apex/BirthdayController.getReadUsers';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import getMessages from '@salesforce/apex/ChatController.getMessages';
// import initFiles from "@salesforce/apex/contentManager.initFiles";
// import queryFiles from "@salesforce/apex/contentManager.queryFiles";
// import loadFiles from "@salesforce/apex/contentManager.loadFiles";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import CONFETTI from '@salesforce/resourceUrl/confettijs';
import PARTY from '@salesforce/resourceUrl/partyjs';
import SWEETALERT from '@salesforce/resourceUrl/sweetalert';
import { loadScript } from 'lightning/platformResourceLoader';
import {
    subscribe,
    unsubscribe,
    onError,
    setDebugFlag,
    isEmpEnabled,
} from 'lightning/empApi';
import MESSAGE_OBJECT from '@salesforce/schema/Ticket_Message__c';
import MESSAGE_FIELD from '@salesforce/schema/Ticket_Message__c.Message__c';
import OWNER_FIELD from '@salesforce/schema/Ticket_Message__c.OwnerId';
import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Parent_Record_Id__c';
// import DOC_FIELD from '@salesforce/schema/Ticket_Message__c.DocumentId__c';
import SOURCE_FIELD from '@salesforce/schema/Ticket_Message__c.Message_Source__c';
import PREVIEW_FIELD from '@salesforce/schema/Ticket_Message__c.Preview_Name__c';
import STATUS_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
import HDOWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import HDMESSAGE_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
import USER_ID from '@salesforce/user/Id';

const MAX_FILE_SIZE = 4500000;
const CHUNK_SIZE = 750000;

export default class ChatTimeline extends LightningElement { 
    @api recordId;
    @api source;
    @api previewMe;
    @api defaultNbFileDisplayed;
    @api limitRows;  
    @api title = 'Timeline';
    @api ticketUsers;
    @api userTitle;
    @api ticketUser;
    @api objectName;
    @api showCustom = false;
    @api showMembers = false;
    @api notifications = []; 
    @api recipients = [];
    customRecipients = [];
    customNotifications = [];
    timelinePostKey;
    timelinePosts;
    mainArea;
    lastSavedData;
    disableButton;
    showFilters;
    showSearch;
    ticketSeenUsers;
    ticketMessageId;
    isModalOpen;
    seenModal;
    sendEmail;
    sendEmailVal;
    followUpTask;
    timelineView;
    timelineFile;
    messageValue;
    createdMessage;
    userId = USER_ID;
    timelinePosts;
    tempIds = [];
    uploadedFiles = []; 
    tempTicketUsers = [];
    userNameValue;
    curUser;
    curName;
    file; 
    fids = '';
    fileContents; 
    fileReader; 
    content; 
    fileName;
    moreLoaded = true;
    loaded = false;
    attachments = {};
    totalFiles;
    moreRecords;
    isLoading;
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
    get options() {
        return [
            { label: 'High', value: 'High' },
            { label: 'Normal', value: 'Normal' },
            { label: 'Low', value: 'Low' },
        ];
    }


    // @wire(getMessages, {parentId: '$recordId'}) timelinePosts;
    @wire(getMessages, {parentId: '$recordId'})
    ticketSetup(result) {
        this.timelinePostKey = result;
        const { data, error } = result;
        if (data) {
            this.timelinePosts = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.timelinePosts = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.timelinePosts = undefined;
        }
        this.lastSavedData = this.timelinePosts;
        this.isLoading = false;
    };
    @wire(getReadUsers, { ticketMessageId: '$ticketMessageId' }) ticketSeenUsers;

    
    connectedCallback() {
        this.disableButton = false;
        this.mainArea = true;
        this.registerErrorListener();
        this.handleSubscribe();
        // console.log(this.recordId);
        Promise.all([
            loadScript(this, CONFETTI + '/confetti.browser.min.js'),
            loadScript(this, PARTY + '/party.min.js'),
            loadScript(this, SWEETALERT + '/sweetalert.min.js'),
            refreshApex(this.timelinePosts)
        ])
            .then(() => {
                console.log('Dependencies Loaded Successfully');
                // this.dispatchEvent(
                // new ShowToastEvent({
                //     title: "Success",
                //     message: "Dependencies loaded successfully",
                //     variant: "Success"
                //     })
                // );
            })
            .catch(error => {
                console.error(error);
                this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error",
                    message: error.message,
                    variant: error
                })
            );
            });
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
    handleEditTimeline() {
        const event = {
            detail: {
                id: this.recordId,
                subject: this.holdSubject
            }
        }
        this.handleTimeline(event);
    } 
    handleTimelineEdit(){
        const event = {
            detail: {
                id: this.recordId,
                subject: this.holdSubject
            }
        }
        this.handleEdit(event);
    }  
    @api
    refreshTimelinePosts(rowId) {
        this.recordId = rowId;
        refreshApex(this.timelinePostKey);
    }
    refreshPosts() {
        return refreshApex(this.timelinePostKey);
    }
    refreshUsers(event) {
        this.refreshPosts();
        const selectEvent = new CustomEvent('refresh', {
            bubbles: true,
            detail: {
                objectName: event.detail.objectName
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    handleMessageChange(event) {
        this.messageValue = event.target.value;
    }
    handleSubjectChange(event) {
        this.subjectValue = event.detail.value;
    }
    handlePriorityChange(event) {
        this.subjectValue = event.detail.value;
    }
    handleIncludeTask() {
        this.followUpTask = !this.followUpTask;
    }
    handleEmailChange(event) {
        this.sendEmailVal = event.target.checked;
    }
    toggleListFilters() {
        this.showFilters = !this.showFilters;
        this.showSearch = !this.showSearch;
        this.timelinePosts = this.lastSavedData;
        refreshApex(this.timelinePostKey);
    }    
    scrollToBottom(){
        let containerChoosen = this.template.querySelector(".containerClass");
        containerChoosen.scrollTop = containerChoosen.scrollHeight;
    }
    enterOnMessage(component){
        if(component.which == 13){
            this.createMessage();
        }
    }
    updateCounters(recordCount){
        this.offset += recordCount;
        this.moreRecords = this.offset < this.totalFiles;
    }
    handleUserChange(event) {
        this.userNameValue = event.target.value;
        console.log(this.userNameValue);
    }
    handleAddUser() {
        // event.preventDefault();
        // event.stopPropagation();
        this.isLoading = true;
        if (!this.recipients.includes(this.userNameValue)) {
            this.customRecipients.push(this.userNameValue);
            console.log('UserVal: '+this.userNameValue);
            console.log('RecipientArrayVal: '+this.customRecipients);
            getCurUser({userId:this.userNameValue})
            .then((result) => {
                console.log(JSON.stringify(result));
                
                // this.curUser = result;
                this.customNotifications.push(result);
                console.log('NotificationArrayVal: '+JSON.stringify(this.customNotifications));
                this.isLoading = false;
                // this.curName = result.Name;
                this.error = undefined;
                this.template.querySelector('lightning-input-field[data-id="userUpdate"]').value = null;
            })
                .catch((error) => {
                    console.log(error);
                    this.error = error;
                    this.isLoading = false;
                    // this.curUser = undefined;
            });
        } else {
            this.template.querySelector('lightning-input-field[data-id="userUpdate"]').value = null;
            this.isLoading = false;
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
    createMessage() {
        this.disableButton = true;
        this.isLoading = true;
        if(this.messageValue){
            const fields = {};
            fields[MESSAGE_FIELD.fieldApiName] = this.messageValue;
            fields[OWNER_FIELD.fieldApiName] = this.userId;
            fields[PARENT_FIELD.fieldApiName] = this.recordId;
            fields[SOURCE_FIELD.fieldApiName] = this.source;
            fields[PREVIEW_FIELD.fieldApiName] = this.source + ' : ' + this.previewMe;
            const recordInput = { apiName: MESSAGE_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(result => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Timeline Updated',
                            variant: 'success',
                        }),
                        );
                        this.sendCustomNotifications(result);
                        refreshApex(this.timelinePostKey)
                        .then(() => {
                            this.isLoading = false;
                            this.disableButton = false;
                            this.messageValue = '';
                            this.scrollToBottom();                
                        })
                        .catch(err => {
                            console.log(JSON.stringify(err));
                        })
                })
                .catch(error => {
                    console.log(JSON.stringify(error));
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error Creating Record',
                            message: 'Contact your Salesforce Admin',
                            variant: 'error',
                        }),
                    );
                });
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Empty Message',
                    message: 'Please Add Something to the Message in order to Send into the Timeline. Contact your Salesforce Administrator w/ any questions.',
                    variant: 'error',
                }),
            );
            this.disableButton = false;
            this.isLoading = false;
            }
    }
    // handleFilesChange(event) {
    //     if(event.target.files.length > 0) {
    //         this.filesUploaded = event.target.files;

    //         for(let item in filesUploaded){
    //             attachments.push(item);
    //         }
    //         for(let i = 0; filesUploaded.length; i++){
    //             this.fileName = event.target.files[i].name;
    //             this.fileSize = this.formatBytes(event.target.files[i].size,2);                
    //         }
    //     }
    // }
    // getBaseUrl(){
    //     let baseUrl = 'https://'+location.host+'/';
    //     return baseUrl;
    // }
    // handleUploadFinished(event) {
    //     var self = this;
    //     //let baseUrl = this.getBaseUrl();
    //     // Get the list of uploaded files
    //     const uploadedFiles = event.detail.files;
    //     var contentDocumentIds = new Array();
    //     for(var file of uploadedFiles){
    //         console.log(JSON.stringify(file));
    //         contentDocumentIds.push(file.documentId);
    //         const fields = {};
    //         //this.messageValue = this.curName + ' just posted a New File<a href="' + baseUrl+'sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId='+file.contentVersionId + '">file</a>';
    //         this.messageValue = this.curName + ' has just attached a New File to this ticket';
    //         fields[MESSAGE_FIELD.fieldApiName] = this.messageValue;
    //         fields[OWNER_FIELD.fieldApiName] = this.userId;
    //         fields[PARENT_FIELD.fieldApiName] = this.recordId;
    //         fields[DOC_FIELD.fieldApiName] = file.documentId;
    //         const recordInput = { apiName: MESSAGE_OBJECT.objectApiName, fields };
    //         createRecord(recordInput)
    //             .then(() => {
    //                 this.dispatchEvent(
    //                     new ShowToastEvent({
    //                         title: 'Success',
    //                         message: 'Timeline Updated',
    //                         variant: 'success',
    //                     }),
    //                 );
    //                 refreshApex(this.timelinePostKey)
    //                 .then(() => {
    //                     this.messageValue = '';
    //                     this.scrollToBottom();                
    //                 })
    //             })
    //             .catch(error => {
    //                 //console.log(JSON.stringify(error));
    //                 this.dispatchEvent(
    //                     new ShowToastEvent({
    //                         title: 'Error Creating Record',
    //                         message: 'Screenshot this and Contact your Salesforce Admin: ' + error.body.message ,
    //                         variant: 'error',
    //                     }),
    //                 );
    //             });
    //     }
    //     queryFiles({ 
    //         recordId: this.recordId, 
    //         contentDocumentIds: contentDocumentIds 
    //     })
    //     .then(result => {
    //         for(var cdl of result){
    //             self.attachments.unshift(self.calculateFileAttributes(cdl));
    //             self.fileCreated = true;
    //             this.fids = cdl.ContentDocumentId + (this.fids=='' ? '' : ',' + this.fids);
    //         }
    //         self.updateCounters(result.length);
    //         this.totalFiles += result.length;
    //         this.initRecords();
    //     });
    // }
    // handleUploadFinishedStmt(event) {
    //     var self = this;
    //     //let baseUrl = this.getBaseUrl();
    //     // Get the list of uploaded files
    //     const uploadedFiles = event.detail.files;
    //     var contentDocumentIds = new Array();
    //     for(var file of uploadedFiles){
    //         console.log(JSON.stringify(file));
    //         contentDocumentIds.push(file.documentId);
    //         const fields = {};
    //         //this.messageValue = this.curName + ' just posted a New File<a href="' + baseUrl+'sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId='+file.contentVersionId + '">file</a>';
    //         this.messageValue = this.curName + ' has just attached a New File to this ticket';
    //         fields[MESSAGE_FIELD.fieldApiName] = this.messageValue;
    //         fields[OWNER_FIELD.fieldApiName] = this.userId;
    //         fields[PARENT_FIELD.fieldApiName] = this.recordId;
    //         fields[DOC_FIELD.fieldApiName] = file.documentId;
    //         const recordInput = { apiName: MESSAGE_OBJECT.objectApiName, fields };
    //         createRecord(recordInput)
    //             .then(() => {
    //                 this.dispatchEvent(
    //                     new ShowToastEvent({
    //                         title: 'Success',
    //                         message: 'Timeline Updated',
    //                         variant: 'success',
    //                     }),
    //                 );
    //                 refreshApex(this.timelinePostKey)
    //                 .then(() => {
    //                     this.messageValue = '';
    //                     this.scrollToBottom();                
    //                 })
    //             })
    //             .catch(error => {
    //                 //console.log(JSON.stringify(error));
    //                 this.dispatchEvent(
    //                     new ShowToastEvent({
    //                         title: 'Error Creating Record',
    //                         message: 'Screenshot this and Contact your Salesforce Admin: ' + error.body.message ,
    //                         variant: 'error',
    //                     }),
    //                 );
    //             });
    //     }
    //     queryFiles({ 
    //         recordId: this.recordId, 
    //         contentDocumentIds: contentDocumentIds 
    //     })
    //     .then(result => {
    //         for(var cdl of result){
    //             self.attachments.unshift(self.calculateFileAttributes(cdl));
    //             self.fileCreated = true;
    //             this.fids = cdl.ContentDocumentId + (this.fids=='' ? '' : ',' + this.fids);
    //         }
    //         self.updateCounters(result.length);
    //         this.totalFiles += result.length;
    //         this.initRecords();
    //     });
    // }
    // handleLoad(event){
    //     let elementId = event.currentTarget.dataset.id;
    //     const eventElement = event.currentTarget;
    //     eventElement.classList.remove('slds-hide');
    //     let dataId = 'lightning-icon[data-id="' + elementId + '"]';
    //     this.template.querySelector(dataId).classList.add('slds-hide');
    // }
    // calculateFileAttributes(item){
    //     let imageExtensions = ['png','jpg','gif'];
    //     let supportedIconExtensions = ['ai','attachment','audio','box_notes','csv','eps','excel','exe','flash','folder','gdoc','gdocs','gform','gpres','gsheet','html','image','keynote','library_folder','link','mp4','overlay','pack','pages','pdf','ppt','psd','quip_doc','quip_sheet','quip_slide','rtf','slide','stypi','txt','unknown','video','visio','webex','word','xml','zip'];
    //     item.src = this.documentForceUrl + '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB120BY90&versionId=' + item.ContentDocument.LatestPublishedVersionId;
    //     item.size = this.formatBytes(item.ContentDocument.ContentSize, 2);
    //     item.icon = 'doctype:attachment';
    //     let fileType = item.ContentDocument.FileType.toLowerCase();
    //     if(imageExtensions.includes(fileType)){
    //         item.icon = 'doctype:image';
    //     }else{
    //         if(supportedIconExtensions.includes(fileType)){
    //             item.icon = 'doctype:' + fileType;
    //         }
    //     }
    //     return item;
    // }
    // initRecords() {
    //     this.isLoading = true;
    //     initFiles({ 
    //         recordId: this.recordId, 
    //         filters: this.conditions, 
    //         defaultLimit: this.defaultNbFileDisplayed, 
    //         sortField: this.sortField, 
    //         sortOrder: this.sortOrder 
    //     })
    //     .then(result => {
    //         this.fids = '';
    //         let listAttachments = new Array();
    //         let contentDocumentLinks = result.contentDocumentLinks;
    //         this.documentForceUrl = result.documentForceUrl;
    //         for(var item of contentDocumentLinks){
    //             listAttachments.push(this.calculateFileAttributes(item));
    //             if (this.fids != '') this.fids += ',';
    //             this.fids += item.ContentDocumentId;
    //         }
    //         this.attachments = listAttachments;
    //         this.totalFiles = result.totalCount;
    //         this.moreRecords = result.totalCount > 3 ? true : false;
    //         let nbFiles = listAttachments.length;
    //         if (this.defaultNbFileDisplayed === undefined){
    //             this.defaultNbFileDisplayed = 6;
    //         }
    //         if (this.limitRows === undefined){
    //             this.limitRows = 3;
    //         }
    //         this.offset = this.defaultNbFileDisplayed;
    //         if(result.totalCount > this.defaultNbFileDisplayed){
    //             nbFiles = this.defaultNbFileDisplayed + '+';
    //         }
    //         this.fileTitle = 'Files (' + nbFiles + ')';
    //         this.disabled = false;
    //         this.loaded = true;
    //     }).catch(error => {
    //         console.log(error);
    //         this.showNotification("Error Loading Files", JSON.stringify(error.message), "error");
    //     }).finally(() => {
    //         this.isLoading = false;
    //     });
    // }
    // showNotification(title, message, variant) {
    //     const event = new ShowToastEvent({
    //         title: title,
    //         message: message,
    //         variant: variant
    //     });
    //     this.dispatchEvent(event);
    // }
    // formatBytes(bytes,decimals) {
    //     if(bytes == 0) return '0 Bytes';
    //     var k = 1024,
    //         dm = decimals || 2,
    //         sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    //         i = Math.floor(Math.log(bytes) / Math.log(k));
    //     return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    // }
    openInfoModal() {
        this.isModalOpen = true;
        this.infoModal = true;
        this.seenModal = false;
        this.modalHeader = 'Help Desk Notice';
    }
    openSeenModal(event) {
        this.ticketMessageId = event.detail.id;
        this.isModalOpen = true;
        this.seenModal = true;
        this.modalHeader = 'Message Seen By...';
        return refreshApex(this.ticketSeenUsers);
    }
    closeModal() {
        this.isModalOpen = false;
    } 
    // openPreview(event){
    //     let elementId = event.currentTarget.dataset.id;
    //     this[NavigationMixin.Navigate]({
    //         type: 'standard__namedPage',
    //         attributes: {
    //             pageName: 'filePreview'
    //         },
    //         state : {
    //             selectedRecordId: elementId,
    //             recordIds: this.fids
    //         }
    //     })
    // }
    // loadMore(){
    //     this.moreLoaded = false;
    //     var self = this;
    //     loadFiles({ 
    //         recordId: this.recordId, 
    //         filters: this.conditions, 
    //         defaultLimit: this.defaultNbFileDisplayed, 
    //         offset: this.offset, 
    //         sortField: this.sortField, 
    //         sortOrder: this.sortOrder 
    //     })
    //     .then(result => {
    //         for(var cdl of result){
    //             self.attachments.push(self.calculateFileAttributes(cdl));
    //             self.fileCreated = true;
    //             if (this.fids != '') this.fids += ',';
    //             this.fids += cdl.ContentDocumentId;
    //         }
    //         self.updateCounters(result.length);
    //         self.moreLoaded = true;
    //     });
    // }
    // openTimelineFile(){
    //     this.timelineFile = true;
    //     this.initRecords();
    //     // refreshApex(this.ticketUsers);
    //     // refreshApex(wiredFiles);
    // }    
    // closeTimelineFile(){
    //     this.timelineFile = false;
    // }
    displaySweetAlert(titleValue, textValue, iconValue, buttonValue) {
        swal({
            title: titleValue,
            text: textValue,
            icon: iconValue,
            button: buttonValue,
        });
    }
    basicCannon() {
        // const useSetX = event.clientX;
        // const useSetY = event.clienty;
        // const viewWidth = window.visualViewport.width();
        // const viewHeight = window.visualViewport.height();
        // const useX = useSetX / viewWidth;
        // const useY = useSetY / viewHeight;
        confetti({
            particleCount: 100,
            spread: 70,
            origin: {
                y: .6,
            }
        });
    }
    partyCannon(e) {
        const runElmt = e.target;
        // const runButton = this.template.querySelector('lightning-button-icon[data-id="timelineSendButton"]');
        party.confetti(runElmt, {
            count: party.variation.range(50, 60),
            size: party.variation.range(0.7, 1.0),
            spread: party.variation.range(10,20)
        });
    }
    fire(particleRatio, opts) {
        let count = 200;
        let defaults = {
            origin: { y: 0.7 }
            };
        confetti(Object.assign({}, defaults, opts, {
            particleCount: Math.floor(count * particleRatio)
        }));
    

    }
    realCannon() {
        this.fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        this.fire(0.2, {
            spread: 60,
        });
        this.fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        this.fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        this.fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    } 
    handleSubscribe() {
        // Callback invoked whenever a new event message is received
        const messageCallback = (response) => {
            console.log('New message received: ', JSON.stringify(response));
            let updatedTicketId = response.data.payload.TicketId__c;
            let seenMsg = response.data.payload.SeenStatus__c;
            let seenUser = response.data.payload.Current_User_Id__c;
;
            if (seenMsg) {
                console.log('Seen User: ' + seenUser);
                console.log('Seen User: ' + this.userId);
                if (seenUser != this.userId) {
                    switch (this.currentPage) {
                        case 'All':
                            this.openAllTickets();
                            break;
                        case 'Projects':
                            this.openProjectTickets();
                            break;
                        case 'Action':
                            this.openActionTickets();
                            break;
                        case 'Idea':
                            this.openIdeaTickets();
                            break;
                        case 'Timeline':
                            this.refreshPosts();
                            this.scrollToBottom();
                    }
                }
            }
        };

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe('/event/Help_Desk_Message__e', -1, messageCallback).then((response) => {
            // Response contains the subscription information on subscribe call
            console.log(
                'Subscription request sent to: ',
                JSON.stringify(response)
            );
            this.subscription = response;
            //this.toggleSubscribeButton(true);
        });
    }
    registerErrorListener() {
        // Invoke onError empApi method
        onError((error) => {
            console.log('Received error from server: ', JSON.stringify(error));
            // Error contains the server-side error
        });
    }    

    handleSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        console.log( 'Search String is ' + searchKey );
        if ( searchKey ) {
            this.timelinePosts = this.lastSavedData;
            console.log( 'Tickets Records are ' + JSON.stringify( this.timelinePosts ) );
            if ( this.timelinePosts ) {
                let recs = [];
                for ( let rec of this.timelinePosts ) {
                    // console.log( 'Rec is ' + JSON.stringify( rec ) );
                    let valuesArray = Object.values( rec );
                    // console.log( 'valuesArray is ' + JSON.stringify( valuesArray ) );
                    for ( let val of valuesArray ) {
                        // console.log( 'val is ' + val );
                        let strVal = String( val );
                        if ( strVal ) {
                            if ( strVal.toLowerCase().includes( searchKey ) ) {
                                recs.push( rec );
                                break;
                            }
                        }
                    }
                }
                console.log( 'Matched Accounts are ' + JSON.stringify( recs ) );
                this.timelinePosts = recs;
             }
        }  else {
            this.timelinePosts = this.lastSavedData;
        }        
    }     
}