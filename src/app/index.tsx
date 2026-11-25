import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { MOCK_ACCOUNT } from '@/services/mock-data';
import { formatSen } from '@/utils/money';

// The balance comes straight from seed data for now. Slice 3a loads it through the mock API.
export default function HomeScreen() {
  return (
    <Screen>
      <Card>
        <AppText variant="caption" color="textMuted">
          Available balance
        </AppText>
        <AppText variant="title">{formatSen(MOCK_ACCOUNT.balanceSen)}</AppText>
      </Card>
      <Button title="Send money" onPress={() => router.push('/transfer/send')} />
    </Screen>
  );
}
