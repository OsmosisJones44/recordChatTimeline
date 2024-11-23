import { LightningElement, api, wire } from 'lwc';
import getReadUsers from '@salesforce/apex/BirthdayController.getReadUsers';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import getRecordMembers from '@salesforce/apex/BirthdayController.getRecordMembers';
import getMessages from '@salesforce/apex/ChatController.getMessages';
import getNumberOfRecordOpenThreads from '@salesforce/apex/ChatController.getNumberOfRecordOpenThreads';
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
import DOCLINK_OBJECT from '@salesforce/schema/ContentDocumentLink';
import DOCID_FIELD from '@salesforce/schema/ContentDocumentLink.ContentDocumentId';
import ENTITY_FIELD from '@salesforce/schema/ContentDocumentLink.LinkedEntityId';
import MESSAGE_OBJECT from '@salesforce/schema/Ticket_Message__c';
import MESSAGE_FIELD from '@salesforce/schema/Ticket_Message__c.Message__c';
import OWNER_FIELD from '@salesforce/schema/Ticket_Message__c.OwnerId';
import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Parent_Record_Id__c';
import DOC_FIELD from '@salesforce/schema/Ticket_Message__c.DocumentId__c';
import SOURCE_FIELD from '@salesforce/schema/Ticket_Message__c.Message_Source__c';
// import THREAD_FIELD from '@salesforce/schema/Ticket_Message__c.Thread__c';
import PREVIEW_FIELD from '@salesforce/schema/Ticket_Message__c.Preview_Name__c';
import STATUS_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
import HDOWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import HDMESSAGE_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
import USER_ID from '@salesforce/user/Id';

// const MAX_FILE_SIZE = 4500000;
// const CHUNK_SIZE = 750000;

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
    notifications = [];
    recipients = [];
    @api showPinned;
    @api showBookmarked;
    @api showThread;
    @api inThread = false;
    @api timelineContainerClass = 'containerClass flexReverse slds-p-top_medium';
    // @api showTimeline = false;
    showTimelineOptions = true;
    showTimelineFileButton;
    openThreads = 0;
    aiContext;
    aiCommand;
    showRecordThreads;
    customRecipients = [];
    customNotifications = [];
    recordMembers;
    recordMembersVal;
    lastSavedMembers;
    isMembersLoading;
    contentDocumentIds = [];
    versionIds = [];
    tempNum = 0;
    timelinePostKey;
    timelinePosts = [];
    mainArea;
    ticketMsg;
    lastSavedData;
    disableButton;
    showFilters;
    showSearch;
    ticketSeenUsers;
    ticketMessageId;
    isModalOpen;
    sendEmail;
    sendEmailVal;
    followUpTask;
    timelineView;
    timelineFile = true;
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
    offset = 0;
    sortIcon = 'utility:arrowdown';
    sortOrder = 'DESC';
    sortField = 'ContentDocument.CreatedDate';
    disabled = true;
    filters = [
        {
            'id': 'gt100KB',
            'label': '>= 100 KB',
            'checked': true
        },
        {
            'id': 'lt100KBgt10KB',
            'label': '< 100 KB and > 10 KB',
            'checked': true
        },
        {
            'id': 'lt10KB',
            'label': '<= 10 KB',
            'checked': true
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
    get noRecords() {
        return this.totalFiles == 0;
    }
    get options() {
        return [
            { label: 'High', value: 'High' },
            { label: 'Normal', value: 'Normal' },
            { label: 'Low', value: 'Low' },
        ];
    }
    get buttonLabel() {
        return this.openThreads + ' Open Threads';
    }
    get buttonVariant() {
        if (this.openThreads > 0) {
            return 'brand';
        } else {
            return 'border';
        }
    }
    get recordIdURL() {
        return this.getBaseUrl() + '/lightning/r/' + this.recordId;
    }

    // @wire(getMessages, {parentId: '$recordId'}) timelinePosts;
    // @wire(getMessages, { parentId: '$recordId' })
    // ticketSetup(result) {
    //     this.timelinePostKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.timelinePosts = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.timelinePosts = undefined;
    //         this.error = error;
    //         console.error(JSON.stringify(error));
    //     } else {
    //         this.error = undefined;
    //         this.timelinePosts = undefined;
    //     }
    //     this.lastSavedData = this.timelinePosts;
    //     this.isLoading = false;
    // };
    @wire(getReadUsers, { ticketMessageId: '$ticketMessageId', userId: '$userId' })
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
        this.disableButton = false;
        this.mainArea = true;
        this.showRecordThreads = false;
        this.showTimelineFileButton = true;
        this.showTimelineOptions = true;
        this.getMessages();
        this.getThreadInfo();
        this.getRecordMembers();
        this.registerErrorListener();
        this.handleSubscribe();
        Promise.all([
            loadScript(this, CONFETTI + '/confetti.browser.min.js'),
            loadScript(this, PARTY + '/party.min.js'),
            loadScript(this, SWEETALERT + '/sweetalert.min.js')
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
        this.scrollToBottom();
    }
    disconnectedCallback(){
        this.handleUnsubscribe();
    }
    runGetUser() {
        getCurUser({ userId: this.userId })
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
    getMessages() {
        getMessages( { parentId: this.recordId })
            .then(result => {
                this.timelinePostsKey = result;
                this.timelinePosts = JSON.parse(JSON.stringify(this.timelinePostsKey));
                this.error = undefined;
            }).catch(err =>{
                console.error(err);
            })
    }
    getThreadInfo() {
        getNumberOfRecordOpenThreads({ recordId: this.recordId })
            .then(result => {
                this.openThreads = JSON.parse(JSON.stringify(result));
                this.lastSavedThreadNumber = this.openThreads;
            }).catch(error => {
                this.openThreads = 0;
                this.error = error;
                console.error(JSON.stringify(error));
            })
    }
    getRecordMembers() {
        getRecordMembers({ recordId: this.recordId, userId: this.userId })
            .then(result => {
                this.recordMembersVal = result;
                this.customNotifications = [...this.recordMembersVal];
                // if(this.customNotifications.length === 0){
                //     this.customNotifications = [...this.recordMembersVal];
                // }
                this.setRecipients();
                this.error = undefined;
                this.lastSavedMembers = this.recordMembersVal;
            }).catch(error => {
                this.recordMembersVal = undefined;
                this.error = error;
                console.error(JSON.stringify(error));
            })
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
    handleTimelineEdit() {
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
        this.refreshPosts();
    }
    refreshPosts() {
        this.getMessages();
        this.getRecordMembers();
        this.getThreadInfo();
        refreshApex(this.ticketSeenUsers);
    }
    //TODO: Remove altogether in favor of setting with recordMemberVal from start
    setRecipients() {
        this.isMembersLoading = true;
        this.showTimelineOptions = false;
        if (this.recordMembersVal.length > 0) {
            this.recordMembersVal.forEach(el => {
                if (!this.customRecipients.includes(el.Id)) {
                    this.customRecipients.push(el.Id);
                }
            })
        }
        this.showTimelineOptions = true;
    }
    refreshUsers(event) {
        refreshApex(this.ticketSeenUsers);
        this.refreshPosts();
        const selectEvent = new CustomEvent('refresh', {
            bubbles: true,
            detail: {
                objectName: event.detail.objectName
            }
        });
        this.dispatchEvent(selectEvent);
    }
    openAiPrompter() {
        this.modalHeader = 'AI Prompter';
        this.aiContext = '';
        this.aiCommand = 'tldr';
        this.isModalOpen = true;
        this.aiModelOpen = true;
    }
    closeAiPrompter() {
        this.aiModelOpen = false;
        this.isModalOpen = false;
    }
    handleMessageChange(event) {
        const htmlContent = event.target.value;
        console.log(JSON.stringify(htmlContent));
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        if(tempDiv.querySelector('img')){
            this.isLoading = true;
            this.extractAndRemoveImgTags(tempDiv);
            const updatedHtmlContent = tempDiv.innerHTML;
            this.messageValue = updatedHtmlContent;
            const el2 = this.template.querySelector('div[data-id="scrollMeIn"]');
            const el = this.template.querySelector('c-upload-file-container');
            el.refresh(this.versionIds);
            const rect = el2.getBoundingClientRect();
            const isVisible = rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);

            if (!isVisible) {
                el2.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
            }
            this.isLoading = false;
        } else {
            this.messageValue = htmlContent;
        }

    }
    extractAndRemoveImgTags(element) {
        if (!element) return;
    
        // Process the current node
        this.processNode(element);
    
        // Traverse all child nodes of the element
        const childNodes = element.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
            const childNode = childNodes[i];
            // Recursively call extractAndRemoveImgTags for each child node
            this.extractAndRemoveImgTags(childNode);
        }
    }
    
    processNode(node) {
        // If the node is an img tag, process it
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'img') {
            const src = node.getAttribute('src');
            if (src && src.includes('/version/download/')) {
                const versionId = this.extractVersionId(src);
                if (versionId) {
                    this.versionIds.push(versionId);
                }
            }
            // Remove the img tag
            node.parentNode.removeChild(node);
        }
    }
    
    // extractAndRemoveImgTags(element) {
    //     if (!element) return;
    
    //     // Traverse all child nodes of the element
    //     const childNodes = element.childNodes;
    //     for (let i = 0; i < childNodes.length; i++) {
    //         const childNode = childNodes[i];
    
    //         // If the child node is an img tag, process it
    //         if (childNode.nodeType === Node.ELEMENT_NODE && childNode.tagName.toLowerCase() === 'img') {
    //             const src = childNode.getAttribute('src');
    //             if (src && src.includes('/version/download/')) {
    //                 const versionId = this.extractVersionId(src);
    //                 if (versionId) {
    //                     this.versionIds.push(versionId);
    //                 }
    //             }
    //             // Remove the img tag
    //             childNode.parentNode.removeChild(childNode);
    //         } else {
    //             // If the child node is not an img tag, recursively process its children
    //             this.extractAndRemoveImgTags(childNode);
    //         }
    //     }
    // }
    extractVersionId(src) {
        const urlParts = src.split('/');
        const versionIdIndex = urlParts.indexOf('version') + 2; // versionId is 2 indices after 'version'
        let versionIdString = urlParts[versionIdIndex];
        let versionId = '';
        // Remove any query parameters
        if (versionIdString.includes('?')) {
            versionId = versionIdString.split('?')[0];
        }
        return versionId;
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
        // refreshApex(this.timelinePostKey);
        this.getMessages();
    }
    openThreadView() {
        this.showRecordThreads = true;
        console.log('ChatTimeline: ' + this.recordId, this.showRecordThreads);
        this.mainArea = false;
        const el = this.template.querySelector('c-thread-record-container');
        el.handleRefresh();
    }
    closeThreadView() {
        this.showRecordThreads = false;
        this.inThread = false;
        console.log('ChatTimeline: ' + this.recordId, this.showRecordThreads);
        this.mainArea = true;
    }
    scrollToBottom() {
        const containerChoosen = this.template.querySelector('.containerClass');
        if (containerChoosen) {
            const scrollHeight = containerChoosen.scrollHeight;
            containerChoosen.scrollTop = scrollHeight;
        } else {
            console.error('.containerClass not found');
        }
    }
    enterOnMessage(component) {
        if (component.which == 13) {
            this.createMessage();
        }
    }
    updateCounters(recordCount) {
        this.offset += recordCount;
        this.moreRecords = this.offset < this.totalFiles;
    }
    handleUserChange(event) {
        this.userNameValue = event.target.value;
        console.log(this.userNameValue);
    }
    handleRemove(event) {
        this.isLoading = true;
        const rowId = event.currentTarget.dataset.filterId;
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
                        // console.log('Notification Sent :' + resId);
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
                    // console.log('DocumentLinkCreated :' + resId);
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
            // if(this.customRecipients.length > 0){
            //     fields[THREAD_FIELD.fieldApiName] = true;
            // }
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
                    if(this.customRecipients.length > 0){
                        this.sendCustomNotifications(result);
                    }
                    if(this.contentDocumentIds.length > 0){
                        this.createContentDocumentLinks(result);
                    }
                    this.refreshPosts();
                    let tempDocumentIds = [];
                    const el = this.template.querySelector('c-upload-file-container');
                    this.contentDocumentIds = [];
                    this.versionIds = [];
                    el.refresh(tempDocumentIds);
                    this.messageValue = '';
                    this.isLoading = false;
                    this.disableButton = false;
                    this.scrollToBottom();
                    this.getRecordMembers();
                    // const queryId = result.id;
                    // const query = 'c-chat-timeline-tile[data-id="'+queryId+'"]';
                    // const el2 = this.template.querySelector(query);
                    // console.log("el2: "+JSON.stringify(el2))
                    // el2.callRefreshFile();
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
        if (event.target.files.length > 0) {
            this.filesUploaded = event.target.files;

            for (let item in filesUploaded) {
                attachments.push(item);
            }
            for (let i = 0; filesUploaded.length; i++) {
                this.fileName = event.target.files[i].name;
                this.fileSize = this.formatBytes(event.target.files[i].size, 2);
            }
        }
    }
    getBaseUrl() {
        let baseUrl = 'https://' + location.host + '/';
        return baseUrl;
    }
    handleUploadFinished(event) {
        var self = this;
        self.attachments = {};
        this.showUploads = true;
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
    handleLoad(event) {
        let elementId = event.currentTarget.dataset.id;
        const eventElement = event.currentTarget;
        eventElement.classList.remove('slds-hide');
        let dataId = 'lightning-icon[data-id="' + elementId + '"]';
        this.template.querySelector(dataId).classList.add('slds-hide');
    }
    calculateFileAttributes(item) {
        let imageExtensions = ['png', 'jpg', 'gif'];
        let supportedIconExtensions = ['ai', 'attachment', 'audio', 'box_notes', 'csv', 'eps', 'excel', 'exe', 'flash', 'folder', 'gdoc', 'gdocs', 'gform', 'gpres', 'gsheet', 'html', 'image', 'keynote', 'library_folder', 'link', 'mp4', 'overlay', 'pack', 'pages', 'pdf', 'ppt', 'psd', 'quip_doc', 'quip_sheet', 'quip_slide', 'rtf', 'slide', 'stypi', 'txt', 'unknown', 'video', 'visio', 'webex', 'word', 'xml', 'zip'];
        item.src = this.documentForceUrl + '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB120BY90&versionId=' + item.ContentDocument.LatestPublishedVersionId;
        item.size = this.formatBytes(item.ContentDocument.ContentSize, 2);
        item.icon = 'doctype:attachment';
        let fileType = item.ContentDocument.FileType.toLowerCase();
        if (imageExtensions.includes(fileType)) {
            item.icon = 'doctype:image';
        } else {
            if (supportedIconExtensions.includes(fileType)) {
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
                for (var item of contentDocumentLinks) {
                    listAttachments.push(this.calculateFileAttributes(item));
                    if (this.fids != '') this.fids += ',';
                    this.fids += item.ContentDocumentId;
                }
                this.attachments = listAttachments;
                this.totalFiles = result.totalCount;
                this.moreRecords = result.totalCount > 3 ? true : false;
                let nbFiles = listAttachments.length;
                if (this.defaultNbFileDisplayed === undefined) {
                    this.defaultNbFileDisplayed = 6;
                }
                if (this.limitRows === undefined) {
                    this.limitRows = 3;
                }
                this.offset = this.defaultNbFileDisplayed;
                if (result.totalCount > this.defaultNbFileDisplayed) {
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
    formatBytes(bytes, decimals) {
        if (bytes == 0) return '0 Bytes';
        var k = 1024,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    openPreview(event) {
        let elementId = event.currentTarget.dataset.id;
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
    loadMore() {
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
                for (var cdl of result) {
                    self.attachments.push(self.calculateFileAttributes(cdl));
                    self.fileCreated = true;
                    if (this.fids != '') this.fids += ',';
                    this.fids += cdl.ContentDocumentId;
                }
                self.updateCounters(result.length);
                self.moreLoaded = true;
            });
    }
    openTimelineMessageOptions() {
        this.showTimelineOptions = !this.showTimelineOptions;
        this.timelineFile = !this.timelineFile;
        // this.setRecipients();
    }
    toggleTimelineFile() {
        this.showTimelineOptions = false;
        if (!this.timelineFile) {
            this.timelineFile = true;
        } else {
            this.timelineFile = false;
        }
    }
    toggleNotifications() {
        this.timelineFile = false;
        if (!this.showTimelineOptions) {
            this.showTimelineOptions = true;
        } else {
            this.showTimelineOptions = false;
        }
    }
    openModal(event) {
        console.log('Event Detail: ' + JSON.stringify(event.detail));
        this.inThread = event.detail.inThread;
        this.isModalOpen = true;
        this.showThreadModal = true;
        this.ticketMessageId = event.detail.id;
        this.ticketMsg = event.detail.ticketMsg;
        if (this.inThread) {
            this.modalHeader = 'Message Info';
        } else {
            this.modalHeader = 'Message Thread';
        }
        // const el = this.template.querySelector('lightning-tabset');
        // el.activeTabValue = 'info';
        return refreshApex(this.ticketSeenUsers);
    }
    closeModal() {
        this.isModalOpen = false;
        this.aiModelOpen = false;
        this.refreshPosts();
        const el = this.template.querySelectorAll('c-chat-timeline-tile');
        el.forEach(elChild => elChild.refreshThread());
    }
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
            spread: party.variation.range(10, 20)
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
        const messageCallback = async (response) => {
            // console.log('New message received: ', JSON.stringify(response));
            await this.refreshPosts();
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
    handleUnsubscribe() {
        // Invoke unsubscribe method of empApi
        unsubscribe(this.subscription, (response) => {
            console.log('unsubscribe() response: ', JSON.stringify(response));
            // Response is true for successful unsubscribe
        });
    }
    handleSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        console.log('Search String is ' + searchKey);
        if (searchKey) {
            this.timelinePosts = this.lastSavedData;
            console.log('Tickets Records are ' + JSON.stringify(this.timelinePosts));
            if (this.timelinePosts) {
                let recs = [];
                for (let rec of this.timelinePosts) {
                    // console.log( 'Rec is ' + JSON.stringify( rec ) );
                    let valuesArray = Object.values(rec);
                    // console.log( 'valuesArray is ' + JSON.stringify( valuesArray ) );
                    for (let val of valuesArray) {
                        // console.log( 'val is ' + val );
                        let strVal = String(val);
                        if (strVal) {
                            if (strVal.toLowerCase().includes(searchKey)) {
                                recs.push(rec);
                                break;
                            }
                        }
                    }
                }
                console.log('Matched Accounts are ' + JSON.stringify(recs));
                this.timelinePosts = recs;
            }
        } else {
            this.timelinePosts = this.lastSavedData;
        }
    }

}