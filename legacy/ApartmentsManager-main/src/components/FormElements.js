import styled from 'styled-components';
import { Link } from "react-router-dom";

export const FormContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding: 0.5em;
  @media screen and (max-width: 768px) {
    flex-direction: column;
    gap: 0;
  }
`;

export const Container = styled.div`
  flex-basis: 50%;
`;

export const ElementWrapper = styled.div`
  position: relative;
  width: 100%;
`;
export const SelectionWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
`;
export const IconButton = styled.button`
display: flex;
align-items: center;
justify-content: center;
background: none;
border: none;
cursor: pointer;
color: var(--bg-dark-2);
font-size: 1.5rem;
padding: 0.2em;
margin-bottom: 0.5rem;
`;

export const Label = styled.label`
  flex-basis: 30%;
  margin-bottom: 0.5rem;
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.5em;
  margin-bottom: 0.5rem;
`;


export const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const Input = styled.input`
  flex-grow: 1;
  gap: 0.5em;
  width: 100%;
  padding: 0.5em;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  outline:  ${({ isValid }) => (isValid ? 'none' : '1px solid var(--error)')};
  border: 1px solid ${({ isValid }) => (isValid ? 'var(--bg-dark-1)' : 'var(--error)')};
`;

export const InputComment = styled.textarea`
  width: 100%;
  height: 200px;
  margin-bottom: 0.5rem;
  word-wrap: break-word; 
  border-radius: 4px;
  padding: 0.5em;
  grid-area: message_form;  
  word-wrap: break-word;
  resize: vertical;
  outline: none;
  border: 1px solid var(--bg-dark-1);
`;

export const SuggestionsWrapper = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
`;

export const Suggestion = styled.div`
  padding: 0.5em;
  cursor: pointer;
  margin-bottom: 0.5rem;
`;
export const Button = styled(Link)`
  border-radius: 4px;
  background: ${({ disabled }) => (disabled ? 'var(--error)' : 'var(--primary-color)')};
  padding: 5px 11px;
  color: var(--text-dark-1);
  outline: none;
  border: 1px solid ${({ disabled }) => (disabled ? 'var(--error)' : 'var(--primary-color)')};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s ease-in-out;

  
    ${({ disabled }) =>
      !disabled &&
      `
      &:hover {
      background: var(--action-active);
      color: var(--text-light-2);
      border: 1px solid var(--bg-dark-1);
    }
    `}
  

  @media screen and (max-width: 768px) {
    font-size: 0.8rem;
  }
`;
