import { LightningElement, wire, api } from 'lwc';
import findRecentTicketMessages from '@salesforce/apex/ChatController.findRecentTicketMessages';
import findRecentOpenTicketMessages from '@salesforce/apex/ChatController.findRecentOpenTicketMessages';
import USER_ID from '@salesforce/user/Id';
import OFFICE_SPACE from '@salesforce/resourceUrl/Office_Space';
import { refreshApex } from '@salesforce/apex';
import {
    subscribe,
    unsubscribe,
    onError,
    setDebugFlag,
    isEmpEnabled,
} from 'lightning/empApi';

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

export default class NotificationList extends LightningElement {
    columns = columns;
    userId = USER_ID;
    officeSpacePic = OFFICE_SPACE;
    showTimeline;
    trueValue = true;
    isLoading = true;
    lastSavedData;
    lastSavedOpenData;
    recentMsgs;
    recentMsgKey;
    recentOpenMsgs;
    recentOpenMsgKey;
    showAll;
    recordId;
    mainArea;
    showSearch;
    error;


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
    @wire(findRecentOpenTicketMessages, { userId: '$userId' })
    notificationSetup(result) {
        this.recentOpenMsgKey = result;
        const { data, error } = result;
        if (data) {
            this.recentOpenMsgs = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.recentOpenMsgs = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.recentOpenMsgs = undefined;
        }
        this.lastSavedOpenData = this.recentOpenMsgs;
        this.isLoading = false;
    }

    connectedCallback() {
        this.showAll = false;
        this.mainArea = true;
        this.registerErrorListener();
        this.handleSubscribe();
    }

    showAllMsgs() {
        this.showAll = true;
    }
    showOpenMsgs() {
        this.showAll = false;
    }
    toggleSearch() {
        this.showSearch = !this.showSearch;
    }

    openTimelineView(event) {
        this.mainArea = false;
        this.recordId = event.detail.id;
    }

    goBack() {
        refreshApex(this.recentMsgKey);
        refreshApex(this.recentOpenMsgKey);
        this.connectedCallback();
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
            // console.log( 'Tickets Records are ' + JSON.stringify( this.recentMsgs ) );
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
                // console.log( 'Matched Accounts are ' + JSON.stringify( recs ) );
                this.recentMsgs = recs;
             }
        }  else {
            this.recentMsgs = this.lastSavedData;
        }        
    }  
    handleOpenSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        console.log( 'Search String is ' + searchKey );
        if ( searchKey ) {
            this.recentOpenMsgs = this.lastSavedOpenData;
            // console.log( 'Tickets Records are ' + JSON.stringify( this.recentMsgs ) );
            if ( this.recentOpenMsgs ) {
                let recs = [];
                for ( let rec of this.recentOpenMsgs ) {
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
                // console.log( 'Matched Accounts are ' + JSON.stringify( recs ) );
                this.recentOpenMsgs = recs;
             }
        }  else {
            this.recentOpenMsgs = this.lastSavedOpenData;
        }        
    }  
    handleSubscribe() {
        // Callback invoked whenever a new event message is received
        const messageCallback = (response) => {
            console.log('New message received: ', JSON.stringify(response));
            refreshApex(this.recentMsgKey);
            refreshApex(this.recentOpenMsgKey);
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