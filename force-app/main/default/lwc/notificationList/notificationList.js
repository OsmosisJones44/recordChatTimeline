import { LightningElement, wire, api } from 'lwc';
import findRecentTicketMessages from '@salesforce/apex/ChatController.findRecentTicketMessages';
import findRecentOpenTicketMessages from '@salesforce/apex/ChatController.findRecentOpenTicketMessages';
// import getTicketMembers from '@salesforce/apex/BirthdayController.getTicketMembers';
// import getSetupMembers from '@salesforce/apex/BirthdayController.getSetupMembers';
// import getCashRequestMembers from '@salesforce/apex/BirthdayController.getCashRequestMembers';
import getRecordMembers from '@salesforce/apex/BirthdayController.getRecordMembers';
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
    recordId;
    userId = USER_ID;
    columns = columns;
    officeSpacePic = OFFICE_SPACE;
    showTimeline;
    trueValue = true;
    isLoading = false;
    lastSavedData;
    lastSavedOpenData;
    showMembers = false;
    showCustom = false;
    ticketMembers;
    setupMembers;
    cashRequestMembers;
    userTitle;
    ticketUsers = {};
    objectName;
    recentMsgs;
    recentMsgKey;
    recentOpenMsgs;
    recentOpenMsgKey;
    showAll;
    mainArea;
    showSearch;
    error;
    timelineTitle;
    pageTitle = 'Timelines with Open Messages';

    get noNewMsg() {
        if (this.recentOpenMsgs.length > 0) {
            return false;
        } else {
            return true;
        }
    }    

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
            // this.recentOpenMsgs = data;
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
    @wire(getRecordMembers, { ticketId: '$recordId', objectName: '$objectName' })
    memberSetup(result) {
        this.membersKey = result;
        const { data, error } = result;
        if (data) {
            this.ticketUsers = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.ticketUsers = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.ticketUsers = undefined;
        }
        this.lastSavedRecordData = this.ticketUsers;
        this.isLoading = false;
    }
    // @wire(getTicketMembers, { ticketId: '$recordId' })
    // ticketMemberSetup(result) {
    //     this.ticketMembersKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.ticketMembers = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.ticketMembers = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.ticketMembers = undefined;
    //     }
    //     this.ticketUsers = {
    //         data: this.ticketMembers
    //     }
    //     this.isLoading = false;
    // }
    // @wire(getSetupMembers, { ticketId: '$recordId' })
    // setupMemberSetup(result) {
    //     this.setupMembersKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.setupMembers = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.setupMembers = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.setupMembers = undefined;
    //     }
    //     // this.ticketUsers.data = this.setupMembers;
    //     this.isLoading = false;
    // }
    // @wire(getCashRequestMembers, { ticketId: '$recordId' })
    // cashMemberSetup(result) {
    //     this.cashRequestMembersKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.cashRequestMembers = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.cashRequestMembers = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.cashRequestMembers = undefined;
    //     }
    //     // this.ticketUsers.data = this.cashRequestMembers;
    //     this.isLoading = false;
    // }    
    // @wire(getTicketMembers, {ticketId: '$recordId'}) ticketMembers;
    // @wire(getSetupMembers, {ticketId: '$recordId'}) setupMembers;
    // @wire(getCashRequestMembers, {ticketId: '$recordId'}) cashRequestMembers;


    connectedCallback() {
        this.showAll = false;
        this.mainArea = true;
        this.pageTitle = 'Open Timeline Messages';
        this.registerErrorListener();
        this.handleSubscribe();
    } 

    showAllMsgs() {
        this.showAll = true;
        this.pageTitle = 'All Timeline Messages';
    }
    showOpenMsgs() {
        this.showAll = false;
        this.pageTitle = 'Open Timeline Messages';
    }
    toggleSearch() {
        this.showSearch = !this.showSearch;
    }
    handleUserSuccess(event) {
        return refreshApex(this.membersKey);
    }
    openTimelineView(event) {
        this.isLoading = true;
        this.recordId = event.detail.id;
        this.timelineTitle = event.detail.preview;
        const source = event.detail.source;
        console.log(this.cashRequestMembers);
        if (source === 'Raise Cash' || source === 'Account Setup' || source === 'Help Desk') {
            switch (source) {
                case 'Raise Cash':
                    this.userTitle = 'Cash Request Members';
                    this.showMembers = true;
                    this.showCustom = false;
                    this.isLoading = false;
                    this.mainArea = false;
                    this.objectName = 'raiseCash';
                    refreshApex(this.membersKey);
                    break;
                case 'Account Setup':
                    this.userTitle = 'Setup Members';
                    this.showMembers = true;
                    this.showCustom = false;
                    this.isLoading = false;
                    this.mainArea = false;
                    this.objectName = 'acctSetup';
                    refreshApex(this.membersKey);
                    break;
                case 'Help Desk':
                    this.userTitle = 'Ticket Members';
                    this.showMembers = true;
                    this.showCustom = false;
                    this.isLoading = false;
                    this.mainArea = false;
                    this.objectName = 'helpDesk';
                    refreshApex(this.membersKey);
                    break;
                default:
                    this.isLoading = false;
                    break;
            }
        } else {
            this.showMembers = false;
            this.showCustom = true;
            this.isLoading = false;
            this.mainArea = false;
        }
    }

    goBack() {
        refreshApex(this.recentMsgKey);
        refreshApex(this.recentOpenMsgKey);
        this.connectedCallback();
    }

    handleTimelineView(event) {
        this.showTimeline = true;
        console.log(event.detail);
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
            this.recentOpenMsgs.data = this.lastSavedOpenData;
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