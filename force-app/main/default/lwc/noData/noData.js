import { LightningElement, api } from 'lwc';

export default class NoData extends LightningElement {
    @api message;
    @api noTask;
    @api noEvent;
    @api lakeMtn;
    @api goingCamping;
    @api fishingDeals;
    @api desert;
    @api openRoad;
    @api research;
    @api goneFishing;
}