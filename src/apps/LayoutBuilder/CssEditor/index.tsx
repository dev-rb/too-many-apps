import { createEffect, createSignal, JSX } from 'solid-js';
import { getCSSLanguageService, TextDocument, getDefaultCSSDataProvider } from 'vscode-css-languageservice';

const selfDocument = TextDocument.create('myurl', 'css', 1, '');
// const data = getDefaultCSSDataProvider();

export const CssEditor = () => {
  const [ref, setRef] = createSignal<HTMLTextAreaElement>();
  const [text, setText] = createSignal('');
  const cssLanguageService = getCSSLanguageService();

  const checkStyleSheet = () => {
    TextDocument.update(selfDocument, [{ text: text() }], 1);
    const styleSheet = cssLanguageService.parseStylesheet(selfDocument);

    const character = ref()?.selectionEnd;
    const line = text().substring(0, character).split(/\r?\n/);

    if (character) {
      console.log(styleSheet);
      const completionList = cssLanguageService.doComplete(selfDocument, { character, line: line.length }, styleSheet, {
        triggerPropertyValueCompletion: true,
        completePropertyWithSemicolon: true,
      });
      console.log(completionList);
    }
  };

  const onTextEdit: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (e) => {
    setText(e.currentTarget.value);
  };

  createEffect(() => {
    text();
    checkStyleSheet();

    // console.log(data.provideProperties());
  });

  return (
    <div id="css-editor" class="flex flex-col bg-dark-5 w-72 p-2 h-full mb-4">
      <textarea ref={setRef} class="w-full h-full color-white bg-dark-6" onInput={onTextEdit} />
    </div>
  );
};
