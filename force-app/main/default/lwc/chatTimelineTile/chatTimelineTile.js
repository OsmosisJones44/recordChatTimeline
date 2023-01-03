import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import getCurrentUserPhoto from '@salesforce/apex/BirthdayController.getCurrentUserPhoto';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import createReadStatus from '@salesforce/apex/ChatController.createReadStatus';
import getUserMsgStatus from '@salesforce/apex/ChatController.getUserMsgStatus';
// import MESSAGE_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
// import TICKET_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import ID_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Id';
import LIKED_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Liked__c';
import MSGID_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
import PINNED_FIELD from '@salesforce/schema/Ticket_Message__c.Pinned__c';
// import OWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import USER_ID from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ChatTimelineTile extends NavigationMixin(LightningElement) {
    @api timelinePost;
    @api curName;
    @api curUser;
    userId = USER_ID;
    smallPhotoUrl;
    showTime;
    seenBy; 
    statusId;
    error;
    liked;
    pinned;
    pinIcon;
    userMsgStatus;
    showLikes = false;
    editMsg;
    messageValue;
    isLoading;
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

    @wire(getUserMsgStatus, {
        userId: '$ticketUser.Id',
        msgId: '$timelinePostId'
    })
    ticketSetup(result) {
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
        console.log(this.timelinePost.Pinned__c);
        this.pinned = this.timelinePost.Pinned__c;
        if (this.pinned) {
            this.pinIcon = 'utility:pinned';
        } else {
            this.pinIcon = 'utility:pin';
        }
        getCurrentUserPhoto({
            userId: this.timelinePost.OwnerId
        })
            .then(result => {
                this.smallPhotoUrl = result;
                this.error = undefined;
            })
            .catch(error => {
                this.smallPhotoUrl = undefined;
                this.error = error;
                console.log(error);
            })
        getUserMsgStatus({
            userId: this.userId,
            msgId: this.timelinePost.Id
        })
            .then(result => {
                this.showLikes = true;
                this.userMsgStatus = result;
                this.liked = this.userMsgStatus.Liked__c;
                this.error = undefined;
            })
            .catch(error => {
                this.userMsgStatus = undefined;
                this.error = error;
                console.log(error);
            })
        createReadStatus({
            ticketMessageId: this.timelinePost.Id,
            userId: this.userId
        })
            .then(result => {
                //console.log(JSON.stringify(result));
                this.statusId = result;
                this.error = undefined;
            })
            .catch(error => {
                this.statusId = undefined;
                this.error = error;
            })
        this.seenBy = this.timelinePost.SeenBy__c;
        this.editMsg = false;
        this.setValues();
    }
    openPreview(){
        //let elementId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state : {
                selectedRecordId: this.timelinePost.DocumentId__c
            }
        })
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
                        message: 'Message Status Updated',
                        variant: 'success'
                    })
                );
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
    handlePinned(event) {
        event.preventDefault();
        this.pinned = !this.pinned;
        if (this.pinned) {
            this.pinIcon = 'utility:pinned';
        } else {
            this.handleSuccess(event);
            this.pinIcon = 'utility:pin';
        }
        const fields = {};
        fields[MSGID_FIELD.fieldApiName] = this.timelinePost.Id;
        fields[PINNED_FIELD.fieldApiName] = this.pinned;
        
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
    openSeenBy(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('seen', {
            detail: {
                id: this.timelinePost.Id
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    editMessage() {
        this.editMsg = true;
    }
    handleMessageChange(event) {
        this.messageValue = event.target.value;
    }    
    handleSubmit() {
        this.isLoading = true;
    }
    handleSuccess(event) {
        event.preventDefault();
        event.stopPropagation();
        this.isLoading = false;
        const selectEvent = new CustomEvent('refresh', {
            detail: {
                Id: this.timelinePost.Id,
                parentId: this.timelinePost.Parent_Ticket__c
            }
        });
        this.dispatchEvent(selectEvent);  
        this.cancelEdit();
    }
    cancelEdit() {
        this.editMsg = false;
    }
    closeTicket(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('close', {
            detail: {
                Id: this.timelinePost.Id,
                parentId: this.timelinePost.Parent_Ticket__c
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
        })
        .catch((error) => {
            this.error = error;
            this.curUser = undefined;
        });
    }
}