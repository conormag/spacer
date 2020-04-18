import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';


export default class SettingsService extends Service {
  @tracked title='Spacer';
}
