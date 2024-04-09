import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id';
// import findRecentThreadTicketMessages from '@salesforce/apex/ChatController.findRecentThreadTicketMessages';
import findRecordThreadTicketMessages from '@salesforce/apex/ChatController.findRecordThreadTicketMessages';
import getRecordMembers from '@salesforce/apex/BirthdayController.getRecordMembers';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import getReadUsers from '@salesforce/apex/BirthdayController.getReadUsers';
import DOCLINK_OBJECT from '@salesforce/schema/ContentDocumentLink';
import DOCID_FIELD from '@salesforce/schema/ContentDocumentLink.ContentDocumentId';
import ENTITY_FIELD from '@salesforce/schema/ContentDocumentLink.LinkedEntityId';
import MESSAGE_OBJECT from '@salesforce/schema/Ticket_Message__c';
import MESSAGE_FIELD from '@salesforce/schema/Ticket_Message__c.Message__c';
import OWNER_FIELD from '@salesforce/schema/Ticket_Message__c.OwnerId';
import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Parent_Record_Id__c';
// import DOC_FIELD from '@salesforce/schema/Ticket_Message__c.DocumentId__c';
import SOURCE_FIELD from '@salesforce/schema/Ticket_Message__c.Message_Source__c';
import THREAD_FIELD from '@salesforce/schema/Ticket_Message__c.Thread__c';
import PREVIEW_FIELD from '@salesforce/schema/Ticket_Message__c.Preview_Name__c';
import STATUS_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
import HDOWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import HDMESSAGE_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
import { refreshApex } from '@salesforce/apex';
import {
    subscribe,
    unsubscribe,
    onError,
    setDebugFlag,
    isEmpEnabled,
} from 'lightning/empApi';

export default class ThreadRecordContainer extends NavigationMixin(LightningElement) {
    @api previewWidth = "slds-col slds-size_1-of-2";
    @api threadWidth = "slds-col slds-size_1-of-2 slds-p-horizontal_x-small slds-p-top_x-small";
    @api showThreadVal = false;
    @api threadBox = "slds-m-left_xx-large";
    @api recordId;
    @api chatToggle = false;
    @api parentRecordId = '';
    @api source;
    messageValue;
    timelineFile = true;
    customNotifications = [];
    customRecipients = [];
    versionIds = [];
    userNameValue;
    contentDocumentIds = [];
    isMembersLoading;
    recordMembers;
    recordMembersVal;
    showTimelineOptions = true;
    seeAllThreads = false;
    sendThreadPost = false;
    postButtonVariant;
    showPreview;
    userId = USER_ID;
    post;
    showThread = false;
    recentThreadMsgKey;
    recentThreadMsgs;
    lastSavedThreadData;    
    recentMsgKey;
    recentMsgs;
    lastSavedData;
    isLoading;
    noData;
    error;
    recordId;
    showTimeline = false;
    ticketSeenUsers;
    ticketUsers;
    ticketMsg = {
        Preview__c: ''
    };
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

    get noMsgSelected() {
        if (this.ticketMsg.Preview__c != '') {
            return false;
        } else {
            return true;
        }
    }    

    constructor() {
        super();
        this.isLoading = true;
    }

    @wire(findRecordThreadTicketMessages, {
        recordId: '$recordId'
    }) 
    ticketSetup(result) {
        this.recentThreadMsgKey = result;
        const { data, error } = result;
        if (data) {
            this.recentThreadMsgs = JSON.parse(JSON.stringify(data)).filter( el => el.Closed_Thread__c === false );
            this.lastSavedThreadData = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.recentThreadMsgs = undefined;
            this.error = error;
            console.error(JSON.stringify(error));
        } else {
            this.error = undefined;
            this.recentMsgs = undefined;
        }
        this.isLoading = false;
    }
    // @wire(findRecentThreadTicketMessages, {
    //     userId: '$userId'
    // }) 
    // threadSetup(result) {
    //     this.recentMsgKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.recentMsgs = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.recentMsgs = undefined;
    //         this.error = error;
    //         console.error(JSON.stringify(error));
    //     } else {
    //         this.error = undefined;
    //         this.recentMsgs = undefined;
    //     }
    //     this.lastSavedData = this.recentMsgs;
    //     this.isLoading = false;
    // }
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
    }
    // @wire(getRecordMembers, { recordId: '$recordId', userId: '$userId' })
    // getMembersSetup(result) {
    //     this.recordMembers = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.recordMembersVal = JSON.parse(JSON.stringify(data));
    //         this.customNotifications = this.recordMembersVal;
    //         this.setRecipients();
    //         this.error = undefined;
    //     } else if (error) {
    //         this.recordMembersVal = undefined;
    //         this.error = error;
    //         console.error(JSON.stringify(error));
    //     } else {
    //         this.error = undefined;
    //         this.recordMembersVal = undefined;
    //     }
    //     this.lastSavedMembers = this.recordMembersVal;
    //     this.isMembersLoading = false;
    // };

    connectedCallback() {
        this.showPreview = true;
        this.showTimeline = false;
        this.postButtonVariant = 'border-filled';
        this.getRecordMembers();
    }
    handleFocusRichText(){
        const el = this.template.querySelector('lightning-input-rich-text[data-id="richTextElement"]');
        el.focus();
    }
    // renderedCallback(){
    //     refreshApex(this.recentThreadMsgKey);
    //     refreshApex(this.recentMsgKey);
    // }
    handleTrainingRedirect() {
        window.open('https://trpg.my.trailhead.com/content/operations/trails/internal-process-hub--timelines', '_blank');
    }
    getRecordMembers() {
        getRecordMembers({ recordId: this.recordId, userId: this.userId })
            .then(result => {
                this.recordMembersVal = result;
                this.customNotifications = [...this.recordMembersVal];
                this.setRecipients();
                this.error = undefined;
                this.lastSavedMembers = this.recordMembersVal;
            }).catch(error => {
                this.recordMembersVal = undefined;
                this.error = error;
                console.error(JSON.stringify(error));
            })
    }
    handleTimelineView(event) {
        if (!this.showTimeline) {
            this.showThreadVal = true;
            this.showTimeline = true;
            if (this.showThreadVal) {
                this.showPreview = true;
            } else {
                this.showPreview = false;
            }
            this.recordId = event.detail.id;
            this.ticketMsg = event.detail.timelinePost;
        } else {
            this.recordId = event.detail.id;
            this.ticketMsg = event.detail.timelinePost;
            // const el = this.template.querySelector('c-chat-timeline');
            // el.refreshTimelinePosts(event.detail.id);
        }
    }
    handleMessageChange(event) {
        this.messageValue = event.target.value;
    }
    @api
    handleRefresh() {
        console.log('threadContianer' + this.recordId);
        return refreshApex(this.recentThreadMsgKey);
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
    handleUploadFinished(event) {
        var self = this;
        self.attachments = {};
        // this.showUploads = true;
        //let baseUrl = this.getBaseUrl();
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;
        for (var file of uploadedFiles) {
            console.log(JSON.stringify(file));
            this.versionIds.push(file.contentVersionId);
            this.contentDocumentIds.push(file.documentId);
        }
        const el = this.template.querySelector('c-upload-file-container');
        el.refresh(this.versionIds);
    }
    toggleNewThread(){
        this.sendThreadPost = !this.sendThreadPost;
        console.log(this.sendThreadPost);
        if(this.sendThreadPost === true){
            this.postButtonVariant = 'brand';
        } else {
            this.postButtonVariant = 'border-filled';
        }
        this.handleFocusRichText();
    }
    handleSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        console.log( 'Search String is ' + searchKey );
        if ( searchKey ) {
            this.recentMsgs = this.lastSavedData;
            console.log( 'Tickets Records are ' + JSON.stringify( this.recentMsgs ) );
            if ( this.recentMsgs ) {
                let recs = [];
                for ( let rec of this.recentMsgs ) {
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
                this.recentMsgs = recs;
             }
        }  else {
            this.recentMsgs = this.lastSavedData;
        }        
    }    
    handleToggleSeeAllThreads(){
        this.seeAllThreads = !this.seeAllThreads;
        const tempList = this.recentThreadMsgs;
        this.recentThreadMsgs = this.lastSavedThreadData;
        this.lastSavedThreadData = tempList;
    }  
    handleUserChange(event) {
        this.userNameValue = event.target.value;
        console.log(this.userNameValue);
    }    
    handleSubscribe() {
        // Callback invoked whenever a new event message is received
        const messageCallback = (response) => {
            console.log('New message received: ', JSON.stringify(response));
            refreshApex(this.recentMsgKey);
            // let updatedTicketId = response.data.payload.TicketId__c;
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
    updateCounters(recordCount){
        this.offset += recordCount;
        this.moreRecords = this.offset < this.totalFiles;
    }
    handleRemove(event) {
        this.isLoading = true;
        const rowId = event.detail.rowId;
        this.customNotifications = this.customNotifications.filter(el => el.Id !== rowId);
        this.customRecipients = this.customRecipients.filter(el => el !== rowId);
        // this.recipients = this.recipients.filter(el => el !== rowId);
        this.isLoading = false;
    }
    handleAddUser() {
        const userId = this.userNameValue;
        this.handleAddUserFunc(userId);
    }
    handleAddUserFunc(userNameValue) {
        const userId = userNameValue;
        // event.preventDefault();
        // event.stopPropagation();
        this.isLoading = true;
        if (userId) {
            if (!this.customRecipients.includes(userId)) {
                this.customRecipients.push(userId);
                console.log('UserVal: ' + userId);
                console.log('RecipientArrayVal: ' + this.customRecipients);
                getCurUser({ userId: userId })
                    .then((result) => {
                        this.curUser = JSON.parse(JSON.stringify(result));
                        this.customNotifications.push(this.curUser);
                        console.log('NotificationArrayVal: ' + JSON.stringify(this.customNotifications));
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
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'User Already Added',
                        message: 'Contact your Salesforce Admin if you have any questions',
                        variant: 'info',
                    }),
                );
                this.isLoading = false;
            }
        } else {
            this.isLoading = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Adding User',
                    message: 'Contact your Salesforce Admin',
                    variant: 'error',
                }),
            );
        }
    }
    sendCustomNotifications(result) {
        console.log(result);
        let tempResult = result;
        console.log(this.customRecipients);
        if (this.customRecipients.length != 0) {
            this.customRecipients.forEach(rec => {
                const fields = {};
                fields[HDMESSAGE_FIELD.fieldApiName] = tempResult.id;
                fields[HDOWNER_FIELD.fieldApiName] = rec;
                const recordInput = { apiName: STATUS_OBJECT.objectApiName, fields };
                createRecord(recordInput)
                    .then(result => {
                        let resId = result;
                        console.log('Notification Sent :' + JSON.stringify(resId));
                    })
                    .catch(error => {
                        console.error(JSON.stringify(error));
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error Creating Custom Notifcations',
                                message: 'Contact your Salesforce Admin' + JSON.stringify(error),
                                variant: 'error',
                            }),
                        );
                    });
            })
        }
    }
    createContentDocumentLinks(result) {
        console.log(result);
        let tempResult = result;
        console.log(this.customRecipients);
        for (let i = 0; i < this.contentDocumentIds.length; i++) {
            const rec = this.contentDocumentIds[i];
            const fields = {};
            fields[ENTITY_FIELD.fieldApiName] = tempResult.id;
            fields[DOCID_FIELD.fieldApiName] = rec;
            const recordInput = { apiName: DOCLINK_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(result => {
                    let resId = result;
                    console.log('DocumentLinkCreated :' + JSON.stringify(resId));
                })
                .catch(error => {
                    console.error(JSON.stringify(error));
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error Creating Custom Notifcations',
                            message: 'Contact your Salesforce Admin' + JSON.stringify(error),
                            variant: 'error',
                        }),
                    );
                });
        }
        
    }
    createMessageStatus(resultId) {
        const fields = {};
        fields[HDMESSAGE_FIELD.fieldApiName] = resultId;
        fields[HDOWNER_FIELD.fieldApiName] = this.userId;
        fields[READ_FIELD.fieldApiName] = true;
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
    }
    createMessage() {
        this.disableButton = true;
        this.isLoading = true;
        if (this.messageValue) {
            const fields = {};
            fields[MESSAGE_FIELD.fieldApiName] = this.messageValue;
            fields[OWNER_FIELD.fieldApiName] = this.userId;
            fields[PARENT_FIELD.fieldApiName] = this.recordId;
            fields[THREAD_FIELD.fieldApiName] = true;
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
                    this.createMessageStatus(result.id);
                    this.sendCustomNotifications(result);
                    this.createContentDocumentLinks(result);
                    this.handleRefresh();
                    let tempDocumentIds = [];
                    const el = this.template.querySelector('c-upload-file-container');
                    this.contentDocumentIds = [];
                    this.versionIds = [];
                    el.refresh(tempDocumentIds);
                    this.disableButton = false;
                    this.messageValue = '';
                    this.isLoading = false;
                    // this.scrollToBottom();
                    this.getRecordMembers();
                    const queryId = result.id;
                    const query = 'c-thread-record-tile[data-id="'+queryId+'"]';
                    const el2 = this.template.querySelector(query);
                    console.log(JSON.stringify(el2));
                    el2.callRefreshFile();
                })
                .catch(error => {
                    console.error(error);
                    // this.dispatchEvent(
                    //     new ShowToastEvent({
                    //         title: 'Error Creating Record',
                    //         message: 'Contact your Salesforce Admin',
                    //         variant: 'error',
                    //     }),
                    // );
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
                this.defaultNbFileDisplayed = 6;
            }
            if (this.limitRows === undefined){
                this.limitRows = 3;
            }
            this.offset = this.defaultNbFileDisplayed;
            if(result.totalCount > this.defaultNbFileDisplayed){
                nbFiles = this.defaultNbFileDisplayed + '+';
            }
            this.fileTitle = 'Files (' + nbFiles + ')';
            this.disabled = false;
            this.loaded = true;
        }).catch(error => {
            console.log(error);
            this.showNotification("Error Loading Files", JSON.stringify(error.message), "error");
        }).finally(() => {
            this.isLoading = false;
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
    formatBytes(bytes,decimals) {
        if(bytes == 0) return '0 Bytes';
        var k = 1024,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
    openTimelineMessageOptions(){
        this.showTimelineOptions = !this.showTimelineOptions;
        this.timelineFile = !this.timelineFile;
        // this.setRecipients();
    }  
    toggleTimelineFile(){
        this.showTimelineOptions = false;
        if(!this.timelineFile){
            this.timelineFile = true;
        } else {
            this.timelineFile = false;
        }
    }
    toggleNotifications(){
        this.timelineFile = false;
        if(!this.showTimelineOptions){
            this.showTimelineOptions = true;
        } else {
            this.showTimelineOptions = false;
        }
    }
    setRecipients(){
        this.isMembersLoading = true;
        this.showTimelineOptions = false;
        if(this.recordMembersVal.length > 0){
            this.recordMembersVal.forEach(el =>{
                if(!this.customRecipients.includes(el.Id)){
                    this.customRecipients.push(el.Id);
                }
            })
        }
        this.showTimelineOptions = true;
    }
}