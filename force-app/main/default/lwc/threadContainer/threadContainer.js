import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
// import { updateRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import findRecentThreadTicketMessages from '@salesforce/apex/ChatController.findRecentThreadTicketMessages';
import findRecentRecordThreadTicketMessages from '@salesforce/apex/ChatController.findRecentRecordThreadTicketMessages';
import getReadUsers from '@salesforce/apex/BirthdayController.getReadUsers';
import STATUS_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
import OWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import MESSAGE_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
import { refreshApex } from '@salesforce/apex';
import {
    subscribe,
    unsubscribe,
    onError,
    setDebugFlag,
    isEmpEnabled,
} from 'lightning/empApi';

export default class ThreadContainer extends NavigationMixin(LightningElement) {
    @api previewWidth = "slds-col slds-size_1-of-2 slds-border_right";
    @api threadWidth = "slds-col slds-size_1-of-2 slds-p-horizontal_x-small slds-p-top_x-small";
    @api showThreadVal = false;
    @api threadBox = "slds-m-left_xx-large slds-box slds-box_xx-small";
    @api recordId;
    @api chatToggle = false;
    @api parentRecordId = '';
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

    @wire(findRecentRecordThreadTicketMessages, {
        userId: '$userId',
        recordId: '$recordId'
    }) 
    ticketSetup(result) {
        this.recentThreadMsgKey = result;
        const { data, error } = result;
        if (data) {
            this.recentThreadMsgs = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.recentThreadMsgs = undefined;
            this.error = error;
            console.error(JSON.stringify(error));
        } else {
            this.error = undefined;
            this.recentMsgs = undefined;
        }
        this.lastSavedThreadData = this.recentThreadMsgs;
        this.isLoading = false;
    }
    @wire(findRecentThreadTicketMessages, {
        userId: '$userId'
    }) 
    threadSetup(result) {
        this.recentMsgKey = result;
        const { data, error } = result;
        if (data) {
            this.recentMsgs = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.recentMsgs = undefined;
            this.error = error;
            console.error(JSON.stringify(error));
        } else {
            this.error = undefined;
            this.recentMsgs = undefined;
        }
        this.lastSavedData = this.recentMsgs;
        this.isLoading = false;
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
    }

    connectedCallback() {
        this.showPreview = true;
        this.showTimeline = false;
    }
    // renderedCallback(){
    //     refreshApex(this.recentThreadMsgKey);
    //     refreshApex(this.recentMsgKey);
    // }
    handleTrainingRedirect() {
        window.open('https://trpg.my.trailhead.com/content/operations/trails/internal-process-hub--timelines', '_blank');
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
    @api
    handleRefresh() {
        console.log('threadContianer' + this.recordId);
        return refreshApex(this.recentMsgKey);
    }
    @api
    handleThreadRefresh() {
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
    handleAddUser() {
        // event.preventDefault();
        // event.stopPropagation();
        this.isLoading = true;
        if (this.userNameValue) {
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
    handleUserSubmit() {
        this.isLoading = true;
        if (this.userNameValue) {
            const fields = {};
            fields[OWNER_FIELD.fieldApiName] = this.userNameValue;
            fields[MESSAGE_FIELD.fieldApiName] = this.recordId;
            fields[OWNER_FIELD.fieldApiName] = this.userId;
            const recordInput = { apiName: STATUS_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'User Added to Thread',
                            variant: 'success',
                        }),
                    );
                    this.isLoading = false;
                    refreshApex(this.ticketSeenUsers);
                })
                .catch(error => {
                    this.isLoading = false;
                    console.log('User Relationship: '+JSON.stringify(error));
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error Creating Record',
                            message: 'Contact your Salesforce Admin',
                            variant: 'error',
                        }),
                    );
                });
        } else {
            this.isLoading = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Please select a user',
                    message: 'Contact your Salesforce Admin w/ any questions',
                    variant: 'error',
                }),
            );
        }
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
}