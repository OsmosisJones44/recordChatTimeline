import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import getCurrentUserPhoto from '@salesforce/apex/BirthdayController.getCurrentUserPhoto';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import createReadStatus from '@salesforce/apex/BirthdayController.createReadStatus';
import getUserMsgStatus from '@salesforce/apex/ChatController.getUserMsgStatus';
// import MESSAGE_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
// import TICKET_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import ID_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Id';
import LIKED_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Liked__c';
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
    userMsgStatus;
    showLikes = false;


    connectedCallback() {
        console.log(this.userId);
        console.log(this.timelinePost.Id);
        getUserMsgStatus({
            userId: this.userId,
            msgId: this.timelinePost.Id
        })
            .then(result => {
                console.log(result);
                this.showLikes = true;
                this.userMsgStatus = result;
                this.liked = this.userMsgStatus.Liked__c;
                this.error = undefined;
                console.log(this.userMsgStatus);
            })
            .catch(error => {
                this.userMsgStatus = undefined;
                this.error = error;
                console.log(error);
            })
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
        this.seenBy = this.timelinePost.SeenBy__c;
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
    handleLiked() {
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
                        message: 'Message Liked',
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
        const eventElement = this.template.querySelector('div[data-id="hoverSelect"]');
        eventElement.classList.remove('slds-hide');
    }
    handleNoHover(){
        const eventElement = this.template.querySelector('div[data-id="hoverSelect"]');
        eventElement.classList.add('slds-hide');
    }
    openSeenBy(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('seen', {
            detail: this.timelinePost.Id
        });
        this.dispatchEvent(selectEvent);  
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
        })
        .catch((error) => {
            this.error = error;
            this.curUser = undefined;
        });
    }
}