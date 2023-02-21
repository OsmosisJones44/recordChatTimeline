import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getCurrentUserPhoto from '@salesforce/apex/BirthdayController.getCurrentUserPhoto';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import createReadStatus from '@salesforce/apex/BirthdayController.createReadStatus';
import getUserMsgStatus from '@salesforce/apex/ChatController.getUserMsgStatus';
// import MESSAGE_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
// import TICKET_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import ID_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Id';
import LIKED_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Liked__c';
import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
import CLOSED_FIELD from '@salesforce/schema/Ticket_Message__c.Closed_Thread__c';

// import OWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import USER_ID from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ChatTableTile extends NavigationMixin(LightningElement) {
    @api msgStatus;
    @api curName;
    @api curUser;
    @api showConversation = false;
    @api showThread = false;
    userId = USER_ID;
    smallPhotoUrl;
    showTime;
    seenBy; 
    statusId;
    error;
    liked;
    userMsgStatus;
    showLikes = false;
    isLoading;
    disableButton;

    @wire(getCurrentUserPhoto, {
        userId: '$msgStatus.Ticket_Message__r.OwnerId'
    })
    ticketSetup(result) {
        this.smallPhotoUrlKey = result;
        const { data, error } = result;
        if (data) {
            this.smallPhotoUrl = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.smallPhotoUrl = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.smallPhotoUrl = undefined;
        }
        this.lastSavedData = this.smallPhotoUrl;
        this.isLoading = false;
    };   
    @wire(getUserMsgStatus, {
        userId: '$ticketUser.Id',
        msgId: '$timelinePostId'
    })
    statusSetup(result) {
        this.msgStatusKey = result;
        const { data, error } = result;
        if (data) {
            this.userMsgStatus = JSON.parse(JSON.stringify(data));
            this.liked = this.userMsgStatus.Liked__c;
            this.error = undefined;
        } else if (error) {
            this.userMsgStatus = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.userMsgStatus = undefined;
        }
        this.lastSavedData = this.userMsgStatus;
        this.isLoading = false;
    };

    connectedCallback() {
        this.showLikes = true;
        this.createdDateParent = new Date(this.msgStatus.Ticket_Message__r.CreatedDate);
        // getCurrentUserPhoto({
        //     userId: this.msgStatus.Ticket_Message__r.OwnerId
        // })
        //     .then(result => {
        //         this.smallPhotoUrl = result;
        //         this.error = undefined;
        //     })
        //     .catch(error => {
        //         this.smallPhotoUrl = undefined;
        //         this.error = error;
        //         console.log(error);
        //     })
        // getUserMsgStatus({
        //     userId: this.userId,
        //     msgId: this.msgStatus.Ticket_Message__r.Id
        // })
        //     .then(result => {
        //         this.userMsgStatus = result;
        //         this.liked = this.userMsgStatus.Liked__c;
        //         this.error = undefined;
        //         console.log(this.userMsgStatus);
        //     })
        //     .catch(error => {
        //         this.userMsgStatus = undefined;
        //         this.error = error;
        //         console.log(error);
        //     })
        this.seenBy = this.msgStatus.Ticket_Message__r.SeenBy__c;
        // this.closedTicket = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Closed_Thread__c;
        this.setValues();
    }
    renderedCallback(){
        refreshApex(this.smallPhotoUrlKey);
        refreshApex(this.msgStatusKey);
    }
    openPreview(){
        //let elementId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state : {
                selectedRecordId: this.msgStatus.Ticket_Message__r.DocumentId__c
            }
        })
    }
    handleOpen() {
        const parentId = this.msgStatus.Ticket_Message__r.Parent_Record_Id__c;
        console.log("ParentId: "+parentId)
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: parentId,
                actionName: 'view'
            }
        });
    }
    handleOpenThread() {
        const parentId = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c;
        console.log("ParentId: "+parentId)
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: parentId,
                actionName: 'view'
            }
        });
    }
    handleResolve(event) {
        event.stopPropagation();
        event.preventDefault();
        this.isLoading = true;
        this.disableButton = true;
        const fields = {};
        fields[PARENT_FIELD.fieldApiName] = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__c;
        fields[CLOSED_FIELD.fieldApiName] = true;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isLoading = false;
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
        fields[PARENT_FIELD.fieldApiName] = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__c;
        fields[CLOSED_FIELD.fieldApiName] = false;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isLoading = false;
                this.disableButton = false;
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
    handleLiked(event) {
        event.preventDefault();
        this.liked = !this.liked;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.userMsgStatus.Id;
        fields[LIKED_FIELD.fieldApiName] = this.liked;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Message Updated',
                        variant: 'success'
                    })
                );
                // Display fresh data in the form
                return refreshApex(this.contact);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Liking Message - Screenshot Me and send to your Salesoforce Administrator',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
    handleHover(){
        const eventElement = this.template.querySelector('lightning-formatted-date-time[data-id="hoverSelect"]');
        eventElement.classList.remove('slds-hide');
    }
    handleNoHover(){
        const eventElement = this.template.querySelector('lightning-formatted-date-time[data-id="hoverSelect"]');
        eventElement.classList.add('slds-hide');
    }
    handleSelect(event){
        // event.preventDefault();
        // event.stopPropagation();
        if (this.showThread) {
            const selectEvent = new CustomEvent('timeline', {
                bubbles: false,
                detail: {
                    msgId: this.msgStatus.Ticket_Message__r.Id,
                    id: this.msgStatus.Ticket_Message__r.Record_Id_Form__c,
                    timelinePost: this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r
                }
            });
            this.dispatchEvent(selectEvent);  
        } else {
            const selectEvent = new CustomEvent('timeline', {
                bubbles: false,
                detail: {
                    msgId: this.msgStatus.Ticket_Message__r.Id,
                    id: this.msgStatus.Ticket_Message__r.Record_Id_Form__c,
                    timelinePost: this.msgStatus.Ticket_Message__r
                }
            });
            this.dispatchEvent(selectEvent); 
        }
    }
    openSeenBy(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('seen', {
            detail: this.msgStatus.Ticket_Message__r.Id
        });
        this.dispatchEvent(selectEvent);  
    }
    handleRefresh(){
        const selectEvent = new CustomEvent('refresh', {
            detail: this.msgStatus.Ticket_Message__r.Id
        });
        this.dispatchEvent(selectEvent);  
    }
    closeTicket(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('close', {
            detail: {
                Id: this.msgStatus.Ticket_Message__r.Id,
                parentId: this.msgStatus.Ticket_Message__r.Parent_Ticket__c
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    setValues(){
        //console.log(this.userId);
        getCurUser({userId:this.userId})
        .then((result) => {
            //console.log(JSON.stringify(result));
            this.curUser = result;
            this.curName = result.Name;
            this.error = undefined;
            // createReadStatus({
            //     ticketMessageId: this.msgStatus.Ticket_Message__r.Id,
            //     userId: this.userId
            // })
            // .then(result => {
            //     //console.log(JSON.stringify(result));
            //     this.statusId = result;
            //     this.error = undefined;
            // })
            // .catch(error => {
            //     this.statusId = undefined;
            //     this.error = error;
            // })
        })
        .catch((error) => {
            this.error = error;
            this.curUser = undefined;
        });
    }
}