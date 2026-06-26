import { useState } from 'react';
import { Box, Flex, Grid, Text, Button, IconButton } from '@chakra-ui/react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// local YYYY-MM-DD (matches Home's date strings)
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 42 cells (6 weeks) starting from the Sunday on/before the 1st of the month
function buildMonthGrid(year, month) {
  const startDow = new Date(year, month, 1).getDay();
  const start = new Date(year, month, 1 - startDow);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function MonthCalendar({ value, onSelect }) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const today = toDateStr(new Date());
  const days = buildMonthGrid(view.year, view.month);
  const monthLabel = new Date(view.year, view.month, 1)
    .toLocaleDateString([], { month: 'long', year: 'numeric' });

  function shiftMonth(delta) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <Box w="280px">
      {/* month nav */}
      <Flex align="center" justify="space-between" mb={2}>
        <IconButton aria-label="Previous month" size="sm" variant="ghost" onClick={() => shiftMonth(-1)}>
          <HiChevronLeft />
        </IconButton>
        <Text fontWeight="semibold">{monthLabel}</Text>
        <IconButton aria-label="Next month" size="sm" variant="ghost" onClick={() => shiftMonth(1)}>
          <HiChevronRight />
        </IconButton>
      </Flex>

      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {DOW.map((d) => (
          <Text key={d} fontSize="xs" color="gray.500" textAlign="center" py={1}>{d}</Text>
        ))}
        {days.map((d) => {
          const ds = toDateStr(d);
          const inMonth = d.getMonth() === view.month;
          const selected = ds === value;
          const isToday = ds === today;
          return (
            <Button
              key={ds}
              size="sm"
              h="34px"
              minW={0}
              px={0}
              borderRadius="md"
              fontWeight={selected || isToday ? 'bold' : 'normal'}
              variant={selected ? 'solid' : 'ghost'}
              colorPalette={selected ? 'green' : 'gray'}
              color={selected ? undefined : inMonth ? 'white' : 'gray.600'}
              borderWidth={isToday && !selected ? '1px' : '0'}
              borderColor="whiteAlpha.400"
              onClick={() => onSelect(ds)}
            >
              {d.getDate()}
            </Button>
          );
        })}
      </Grid>
    </Box>
  );
}

export default MonthCalendar;
