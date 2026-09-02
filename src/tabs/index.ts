import type { TabKey } from '../types';
import ScheduleTab from './ScheduleTab';
import RestaurantsTab from './RestaurantsTab';
import TodoTab from './TodoTab';
import BudgetTab from './BudgetTab';
import MyTab from './MyTab';

export const TAB_VIEWS: Record<TabKey, () => JSX.Element> = {
  schedule: ScheduleTab,
  restaurants: RestaurantsTab,
  todo: TodoTab,
  budget: BudgetTab,
  my: MyTab,
};
