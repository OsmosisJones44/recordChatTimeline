import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import getReadUsers from '@salesforce/apex/BirthdayController.getReadUsers';
import deleteThreadMember from '@salesforce/apex/ChatController.deleteThreadMember';
// import initFiles from "@salesforce/apex/contentManager.initFiles";
// import queryFiles from "@salesforce/apex/contentManager.queryFiles";
// import loadFiles from "@salesforce/apex/contentManager.loadFiles";
import USER_ID from '@salesforce/user/Id';
// import MESSAGE_OBJECT from '@salesforce/schema/Ticket_Message__c';
// import MESSAGE_FIELD from '@salesforce/schema/Ticket_Message__c.Message__c';
// import OWNER_FIELD from '@salesforce/schema/Ticket_Message__c.OwnerId';
// import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Parent_Record_Id__c';
import PARENTID_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
import CLOSED_FIELD from '@salesforce/schema/Ticket_Message__c.Closed_Thread__c';
import STATUS_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
import HDOWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import HDMESSAGE_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import HIDDEN_FIELD from '@salesforce/schema/Ticket_Message__c.Hidden__c';
// import DOC_FIELD from '@salesforce/schema/Ticket_Message__c.DocumentId__c';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class ThreadTile extends NavigationMixin(LightningElement) {
    @api recordId;
    @api threadId;
    @api mainArea;
    @api preview;
    @api iconName;
    @api parentRecordId;
    // @api ticketUsers = [];
    @api customRecipients;
    @api showThread = false;
    @api threadBox = "slds-m-left_xx-large slds-box slds-box_xx-small";
    @api timelineContainerClass = 'threadTimelineClass flexReverse slds-p-top_medium';
    @api ticketMsg;
    @api showMsg = false;
    @api showParentTimeline = false;
    userId = USER_ID;
    isLoading = false;
    disableButton;
    curUser;
    adminMode;
    curName;
    error;
    ticketMessageId;
    ticketUsers;
    ticketSeenUsers;
    title;
    moreLoaded = true;
    loaded = false;
    attachments = {};
    totalFiles;
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
    handleOpenThreadIndividually() {
        console.log('Navigation Attempt');
        this[NavigationMixin.GenerateUrl](
            {
                type: "standard__app",
                attributes: {
                    appTarget: "c__TRPG_Timelines",
                    pageRef: {
                        type: 'standard__namedPage',
                        attributes: {
                            pageName: 'home'
                        },
                        state: {
                            c__threadId: this.recordId,
                        }
                    }
                }
            }).then(url =>{
                window.open(url, "_blank");
            }).catch(err => {
                console.error('NavError: '+err);
            }).finally(() => 'Navigated');
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
        fields[PARENTID_FIELD.fieldApiName] = this.recordId;
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
                console.error(error);
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
        fields[PARENTID_FIELD.fieldApiName] = this.recordId;
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
                console.error(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Re-Opening Message Thread',
                        message: 'Screenshot Me and send to your Salesoforce Administrator',
                        variant: 'error'
                    })
                );
            });
    }    
    handleRefresh(){
        const selectEvent = new CustomEvent('refresh', {
            detail: this.recordId
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
                fields[HDMESSAGE_FIELD.fieldApiName] = this.recordId;
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
    handleDeleteThreadMember(){
        deleteThreadMember({recordId: this.recordId})
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
}