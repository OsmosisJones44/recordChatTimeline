import { LightningElement, api, wire } from 'lwc';
import getCurrentUserPhoto from '@salesforce/apex/BirthdayController.getCurrentUserPhoto';
import { NavigationMixin } from 'lightning/navigation';
// import { createRecord } from 'lightning/uiRecordApi';
// import MESSAGE_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
// import TICKET_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
// import OWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import createReadStatus from '@salesforce/apex/BirthdayController.createReadStatus';
import USER_ID from '@salesforce/user/Id';

export default class ChatTimelineTile extends LightningElement {
    @api timelinePost;
    @api curName;
    @api curUser;
    userId = USER_ID;
    smallPhotoUrl;
    showTime;
    seenBy; 
    statusId;
    error;

    connectedCallback() {
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