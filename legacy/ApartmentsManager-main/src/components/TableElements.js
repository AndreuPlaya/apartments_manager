import styled from 'styled-components';

const Table = styled.table`
  font-size: 0.8rem;
  width: 100%;
  color: var(--text-light-1);
  gap: 0.1em;
`;

const TableButton = styled.button`
  padding: 0.15em;
  font-size: 0.8rem;
  color: var(--text-light-1);
  @media (max-width: 768px) {
    padding: 0.1em;
    font-size: 0.7rem;
}
`;
const TableRow = styled.tr`
cursor: pointer;
    border: ${({ isHighlighted }) => isHighlighted ? '2px solid red' : ''};
`;

const TableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TableTh = styled.th`
  background-color: var(--bg-light-1);
  text-align: left;
  border: 1px solid var(--bg-light-2);
  padding: 0.5em;
  @media (max-width: 768px) {
    padding: 0.1em;
    font-size: 0.7rem;
}
`;

const TableCell = styled.td`
  background-color: ${({ isToday }) => isToday ? 'var(--primary-color)' : 'var(--bg-light-1)'};
  text-align: left;
  border: 1px solid var(--bg-light-2);
  padding: 0.5em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  @media (max-width: 768px) {
    max-width: 120px;
      padding: 0.1em;
      font-size: 0.7rem;
  }
`;

export { Table, TableButton, TableHead, TableRow, TableTh, TableCell };