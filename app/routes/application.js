import Route from '@ember/routing/route';
//import subscribe from 'ember-cordova-events/utils/subscribe';
import {inject as service} from '@ember/service';


export default class ApplicationRoute extends Route {

  @service('ember-cordova/events') events;
  @service appstatus


}