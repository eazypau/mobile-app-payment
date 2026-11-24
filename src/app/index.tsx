import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

// Placeholder Home screen that exercises the UI primitives.
// The real balance and recent transfers arrive in slice 3a.
export default function HomeScreen() {
  return (
    <Screen>
      <Card>
        <AppText variant="caption" color="textMuted">
          Available balance
        </AppText>
        <AppText variant="title">RM —</AppText>
      </Card>
      <Button title="Send money" onPress={() => {}} disabled />
    </Screen>
  );
}
