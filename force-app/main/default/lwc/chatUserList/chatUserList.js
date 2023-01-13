import { LightningElement, api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import MESSAGE_OBJECT from '@salesforce/schema/Ticket_Message__c';
import MESSAGE_FIELD from '@salesforce/schema/Ticket_Message__c.Message__c';
import OWNER_FIELD from '@salesforce/schema/Ticket_Message__c.OwnerId';
import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Parent_Record_Id__c';
// import HIDDEN_FIELD from '@salesforce/schema/Ticket_Message__c.Hidden__c';
import DOC_FIELD from '@salesforce/schema/Ticket_Message__c.DocumentId__c';
import USER_OBJECT from '@salesforce/schema/User_Ticket_Relationship__c';
import USER_FIELD from '@salesforce/schema/User_Ticket_Relationship__c.User__c';
import TICKETOWN_FIELD from '@salesforce/schema/User_Ticket_Relationship__c.OwnerId';
import TICKET_FIELD from '@salesforce/schema/User_Ticket_Relationship__c.Account_Setup__c';
import ACTIVE_FIELD from '@salesforce/schema/User_Ticket_Relationship__c.Active__c';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';

export default class ChatUserList extends LightningElement {
    @api ticketUsers;
    @api title;
    
    handleUserChange(event){
        this.userNameValue = event.target.value;
    }    
    handleUserSuccess() {
        const selectEvent = new CustomEvent('refresh', {
            bubbles: true
        });
        this.dispatchEvent(selectEvent);  
    }
    handleUserSubmit() {
        const fields = {};
        fields[USER_FIELD.fieldApiName] = this.userNameValue;
        fields[TICKETOWN_FIELD.fieldApiName] = this.userId;
        fields[TICKET_FIELD.fieldApiName] = this.recordId;
        fields[ACTIVE_FIELD.fieldApiName] = true;
        const recordInput = { apiName: USER_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Timeline Updated',
                        variant: 'success',
                    }),
                );
                refreshApex(this.ticketUsers)
                .then(result =>{
                    getCurUser({
                        userId: this.userNameValue
                    })
                    .then(result =>{
                        this.selectedName = result.Name;
                        const fields = {};
                        this.messageValue = this.selectedName + ' was just added to the Ticket';
                        fields[MESSAGE_FIELD.fieldApiName] = this.messageValue;
                        fields[OWNER_FIELD.fieldApiName] = this.userId;
                        fields[PARENT_FIELD.fieldApiName] = this.recordId;
                        // fields[HIDDEN_FIELD.fieldApiName] = true;
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
                                this.template.querySelector('lightning-input-field[data-id="userUpdate"]').value = null;
                            })
                            .catch(error => {
                                //console.log(JSON.stringify(error));
                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'Error Creating Record',
                                        message: 'Contact your Salesforce Admin',
                                        variant: 'error',
                                    }),
                                );
                            });
                    })
                    .catch(error =>{
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error Getting User',
                                message: 'Contact your Salesforce Admin',
                                variant: 'error',
                            }),
                        );
                    })
                })
            })
            .catch(error => {
                //console.log(JSON.stringify(error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Creating Record',
                        message: 'Contact your Salesforce Admin',
                        variant: 'error',
                    }),
                );
            });
    } 
}