import { SearchTypeEnum, useAnswersActions, useAnswersState } from '@yext/answers-headless-react';
import { InputDropdownCssClasses } from './InputDropdown';
import { ReactComponent as YextLogoIcon } from '../icons/yext_logo.svg';
import '../sass/Autocomplete.scss';
import { DropdownSectionCssClasses } from './DropdownSection';
import { processTranslation } from './utils/processTranslation';
import SearchButton from './SearchButton';
import { useSynchronizedRequest } from '../hooks/useSynchronizedRequest';
import useSearchWithNearMeHandling from '../hooks/useSearchWithNearMeHandling';
import { CompositionMethod, useComposedCssClasses } from '../hooks/useComposedCssClasses';
import renderAutocompleteResult, {
  AutocompleteResultCssClasses,
  builtInCssClasses as AutocompleteResultBuiltInCssClasses
} from './utils/renderAutocompleteResult';
import { ReactComponent as MagnifyingGlassIcon } from '../icons/magnifying_glass.svg';
import Dropdown from './Dropdown/Dropdown';
import DropdownInput from './Dropdown/DropdownInput';
import DropdownItem from './Dropdown/DropdownItem';
import DropdownMenu from './Dropdown/DropdownMenu';
import classNames from 'classnames';
import { PropsWithChildren, useContext, useMemo, useState } from 'react';
import ScreenReader from './ScreenReader';
import DropdownContext from './Dropdown/DropdownContext';

export const builtInCssClasses: SearchBarCssClasses = {
  container: 'h-12 mb-3',
  divider: 'border-t border-gray-200 mx-2.5',
  dropdownContainer: 'relative bg-white pt-4 pb-3 z-10',
  inputContainer: 'inline-flex items-center justify-between w-full',
  inputDropdownContainer: 'bg-white border rounded-3xl border-gray-200 w-full overflow-hidden',
  inputDropdownContainer___active: 'shadow-lg',
  inputElement: 'outline-none flex-grow border-none h-full pl-0.5 pr-2',
  logoContainer: 'w-7 mx-2.5 my-2',
  optionContainer: 'flex items-stretch py-1.5 px-3.5 cursor-pointer hover:bg-gray-100',
  resultIconContainer: 'opacity-20 w-7 h-7 pl-1 mr-4',
  searchButtonContainer: ' w-8 h-full mx-2 flex flex-col justify-center items-center',
  submitButton: 'h-7 w-7',
  focusedOption: 'bg-gray-100',
  ...AutocompleteResultBuiltInCssClasses
}

export interface SearchBarCssClasses
  extends InputDropdownCssClasses, DropdownSectionCssClasses, AutocompleteResultCssClasses {
  container?: string,
  inputDropdownContainer?: string,
  resultIconContainer?: string,
  submitButton?: string
}

interface Props {
  placeholder?: string,
  geolocationOptions?: PositionOptions,
  customCssClasses?: SearchBarCssClasses,
  cssCompositionMethod?: CompositionMethod
}

/**
 * Renders a SearchBar that is hooked up with an InputDropdown component
 */
export default function SearchBar({
  placeholder,
  geolocationOptions,
  customCssClasses,
  cssCompositionMethod
}: Props) {
  const cssClasses = useComposedCssClasses(builtInCssClasses, customCssClasses, cssCompositionMethod);
  const answersActions = useAnswersActions();
  const query = useAnswersState(state => state.query.input);
  const isLoading = useAnswersState(state => state.searchStatus.isLoading);
  const isVertical = useAnswersState(s => s.meta.searchType) === SearchTypeEnum.Vertical;
  const [autocompleteResponse, executeAutocomplete] = useSynchronizedRequest(() => {
    return isVertical
      ? answersActions.executeVerticalAutocomplete()
      : answersActions.executeUniversalAutocomplete();
  });
  const [executeQuery, autocompletePromiseRef] = useSearchWithNearMeHandling(answersActions, geolocationOptions);
  if (autocompleteResponse) {
    // autocompleteResponse.results = [
    //   {
    //     value: 'a',
    //   }, {
    //     value: 'a'
    //   }, {
    //     value: 'b'
    //   }
    // ]
  }
  // console.log(autocompleteResponse?.results)

  function renderSearchButton() {
    return (
      <div className={cssClasses.searchButtonContainer}>
        <SearchButton
          className={cssClasses.submitButton}
          handleClick={executeQuery}
          isLoading={isLoading || false}
        />
      </div>
    );
  }

  function renderInput() {
    return (
      <DropdownInput
        className={cssClasses.inputElement}
        placeholder={placeholder}
        onSubmit={() => executeQuery()}
        onFocus={value => {
          answersActions.setQuery(value || '');
          autocompletePromiseRef.current = executeAutocomplete()
        }}
        onChange={value => {
          answersActions.setQuery(value || '');
          autocompletePromiseRef.current = executeAutocomplete();
        }}
      />
    );
  }

  const numItems = autocompleteResponse?.results.length || 0;
  const screenReaderText = processTranslation({
    phrase: `${numItems} autocomplete option found.`,
    pluralForm: `${numItems} autocomplete options found.`,
    count: numItems
  });

  const activeClassName = classNames(cssClasses.inputDropdownContainer, {
    [cssClasses.inputDropdownContainer___active ?? '']: numItems > 0
  });

  return (
    <>
      <div className={cssClasses.container}>
        <Dropdown
          className={cssClasses.inputDropdownContainer}
          activeClassName={activeClassName}
          screenReaderText={screenReaderText}
          numItems={numItems}
          initialValue={query}
          onSelect={value => {
            answersActions.setQuery(value || '');
            autocompletePromiseRef.current = executeAutocomplete()
            executeQuery();
          }}
        >
          <div className={cssClasses?.inputContainer}>
            <div className={cssClasses.logoContainer}>
              <YextLogoIcon />
            </div>
            {renderInput()}
            {renderSearchButton()}
          </div>
          {numItems > 0 &&
            <StyledDropdownMenu cssClasses={cssClasses}>
              {autocompleteResponse?.results.map((result, i) => (
                <DropdownItem
                  key={i}
                  index={i}
                  className={cssClasses.optionContainer}
                  focusedClassName={cssClasses.optionContainer + ' ' + cssClasses.focusedOption}
                  value={result.value}
                >
                  {renderAutocompleteResult(result, cssClasses, MagnifyingGlassIcon, `autocomplete option: ${result.value}`)}
                </DropdownItem>
              ))}
            </StyledDropdownMenu>
          }
        </Dropdown>
      </div>
    </>
  );
}

function StyledDropdownMenu({ cssClasses, children }: PropsWithChildren<{
  cssClasses: {
    divider?: string,
    dropdownContainer?: string,
    sectionContainer?: string,
    optionsContainer?: string
  }
}>) {
  return (
    <DropdownMenu>
      <div className={cssClasses.divider} />
      <div className={cssClasses.dropdownContainer}>
        <div className={cssClasses.sectionContainer}>
          <div className={cssClasses.optionsContainer}>
            {children}
          </div>
        </div>
      </div>
    </DropdownMenu>
  )
}