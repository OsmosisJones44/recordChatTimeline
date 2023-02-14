import { LightningElement, api } from 'lwc';

export default class ZzOpenRoad extends LightningElement {
    @api message;
    @api showTraining = false;
}