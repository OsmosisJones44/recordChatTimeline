import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getTicketMessage from '@salesforce/apex/ChatController.getTicketMessage';

export default class MessageCenterUtility extends LightningElement {
    @api recordId;
    threadId;
    tempNum;
    isLoading;
    activeTabValue;
    showThread;
    showMsg = false;
    ticketMsg = {
        Pinned__c: false,
        Liked__c: false,
        Preview__c: '',
        Icon_Name__c: ''
    };

    currentPageReference;
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        this.currentPageReference = currentPageReference;
    }

    connectedCallback(){
        this.threadId = this.currentPageReference.state.c__threadId;
        if(this.threadId !== undefined){
            this.showThread = true;
            getTicketMessage({ticketMessageId: this.threadId})
            .then((result) => {
                this.ticketMsg = result;
                this.showMsg = true;
                // console.log('ticketMessage'+ JSON.stringify(this.ticketMsg));
            })
            .catch((error) => {
                let err = error;
                console.error(err);
            });
        }
    }

    handleCloseThread(){
        this.showThread = false;
    }

}