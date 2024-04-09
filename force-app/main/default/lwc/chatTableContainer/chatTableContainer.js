import { LightningElement, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import findRecentTicketMessages from '@salesforce/apex/ChatController.findRecentTicketMessages';
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

export default class ChatTableContainer extends NavigationMixin(LightningElement) {
    @api previewWidth = "slds-col slds-size_1-of-2 slds-border_right";
    @api timelineWidth = "slds-col slds-size_1-of-2 slds-p-horizontal_x-small slds-p-top_x-small";
    @api showTimelineVal = false;
    @api parentRecordId = '';
    columns = columns;
    userId = USER_ID;
    officeSpacePic = OFFICE_SPACE;
    showTimeline;
    trueValue = true;
    isLoading;
    lastSavedData;
    recentMsgs;
    recentMsgKey;
    recordId = '';
    showTimeline = false;

    get noMsgSelected() {
        if (this.recordId != '') {
            return false;
        } else {
            return true;
        }
    }  

    constructor() {
        super();
        this.isLoading = true;
    }

    // @wire(findRecentTicketMessages, { userId: '$userId' }) recentMsgs;
    @wire(findRecentTicketMessages, { userId: '$userId' })
    ticketSetup(result) {
        this.recentMsgKey = result;
        const { data, error } = result;
        if (data) {
            console.log(JSON.stringify(data));
            this.recentMsgs = JSON.parse(JSON.stringify(data));
            if (this.parentRecordId) {
                this.recentMsgs = this.recentMsgs.filter(msg => msg.Parent_Record_Id__c === this.parentRecordId);
            }
            this.error = undefined;
            this.noData = false
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

    connectedCallback() {
        this.registerErrorListener();
        this.handleSubscribe();
    }

    handleTimelineView(event) {
        console.log(JSON.stringify(event.detail));
        this.showTimeline = true;
        this.recordId = event.detail.id;
        this.ticketMsg = event.detail.timelinePost;
        // const el = this.template.querySelector('c-chat-timeline');
        // el.refreshTimelinePosts(event.detail.id);
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
    handleRefresh() {
        return refreshApex(this.recentMsgKey);
    }
    handleTrainingRedirect() {
        window.open('https://trpg.my.trailhead.com/content/operations/trails/internal-process-hub--timelines', '_blank');
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