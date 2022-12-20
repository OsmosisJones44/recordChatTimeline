import { LightningElement, wire } from 'lwc';
import findRecentTicketMessages from '@salesforce/apex/ChatController.findRecentTicketMessages';
import USER_ID from '@salesforce/user/Id';
import OFFICE_SPACE from '@salesforce/resourceUrl/Office_Space';
import { refreshApex } from '@salesforce/apex';

const columns = [
    {
        label: 'Name',
        fieldName: 'Name',
        wrapText: true,
        sortable: true
    },
    {
        label: 'Rec',
        fieldName: 'Record_Id_Form__c',
        wrapText: true,
        sortable: true
    }
];

export default class ChatTableContainer extends LightningElement {
    columns = columns;
    userId = USER_ID;
    officeSpacePic = OFFICE_SPACE;
    showTimeline;
    trueValue = true;
    isLoading = true;
    lastSavedData;
    recentMsgs;
    recentMsgKey;


    // @wire(findRecentTicketMessages, { userId: '$userId' }) recentMsgs;
    @wire(findRecentTicketMessages, { userId: '$userId' })
    ticketSetup(result) {
        this.recentMsgKey = result;
        const { data, error } = result;
        if (data) {
            this.recentMsgs = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.recentMsgs = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.recentMsgs = undefined;
        }
        this.lastSavedData = this.recentMsgs;
        this.isLoading = false;
    }

    handleTimelineView(event) {
        this.showTimeline = true;
        this.recordId = event.detail.id;
        const el = this.template.querySelector('c-chat-timeline');
        el.refreshTimelinePosts(event.detail.id);
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

}