import NewBill from '../containers/NewBill.js';
import BillsUI from '../views/BillsUI.js';
import NewBillUI from '../views/NewBillUI.js';
import { ROUTES } from '../constants/routes.js';

import { localStorageMock } from '../__mocks__/localStorage.js';
import firebase from '../__mocks__/firebase.js';

import { fireEvent, screen } from '@testing-library/dom';

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const firestore = null;

window.localStorage.setItem(
  'user',
  JSON.stringify({
    type: 'Employee',
  })
);

//je suis sur la page NewBill quand j'envoie un correct formulaire
//est ce que je suis rediriger vers la page Bills 
//test 1 = est ce que la fct handleSubmit est appelée
//test 2: est que le titre Mes notes de frais est visible
describe('Given i am logged as an employee', () => {
  describe('When I am on NewBill page and I submit a correct form', () => {
    test('Then I should be redirected to Bills page', () => {    

      document.body.innerHTML = NewBillUI();
      const newBillContainer = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBillContainer.handleSubmit);
      newBillContainer.fileName = 'image.jpg';

      const newBillForm = screen.getByTestId('form-new-bill');
      newBillForm.addEventListener('submit', handleSubmit);
      fireEvent.submit(newBillForm);

      expect(handleSubmit).toHaveBeenCalled();

      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy();
    });
  });
  //test [bug Hunt] bills (n3)
  describe('When I am on NewBill page and I choose a file extension that is not .jpg, .jpeg or .png', () => {
    test('Then an error message should be throwed', () => {      
      document.body.innerHTML = NewBillUI();
      const newBillContainer = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBillContainer.handleChangeFile);

      const fileInput = screen.getByTestId('file');
      fileInput.addEventListener('change', handleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['document.pdf'], 'document.pdf', {
              type: 'application/pdf',
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();

      expect(fileInput.files[0].name).toBe('document.pdf');

      const errorMessage = screen.getByTestId('error-message');

      expect(errorMessage.textContent).toEqual(
        expect.stringContaining('les extensions autorisées sont : png, jpeg, jpg')
      );
    });
  });

  describe('When I am on NewBill page and I choose a file with .jpg, .jpeg or .png extension', () => {
    
    test('When the error message should not apparears', () => {  
      document.body.innerHTML = NewBillUI();

      const newBillContainer = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBillContainer.handleChangeFile);
      const handleFirestoreStorage = jest.fn(newBillContainer.handleFirestoreStorage);

      const fileInput = screen.getByTestId('file');
      fileInput.addEventListener('change', handleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [new File(['image.png'], 'image.png', { type: 'image/png' })],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      const rs = handleFirestoreStorage(null, null);
      expect(rs).toBe(false);

      expect(fileInput.files[0].name).toBe('image.png');

      const errorMessage = screen.getByTestId('error-message');

      expect(errorMessage.textContent).toBe('');
    });
  });
});
//Ajout Test d'integration Post New Bill
describe('Given I am  connected as an employee and on new bills page', () => {
  describe('When i create a new bill', () => {
    test('Then number of bills fetched from firebase mocked api is incremented', async () => {
      const postSpy = jest.spyOn(firebase, 'post');
      const testBill = {
        id: '3Eend33edu23921',
        email: 'test@test.fr',
        type: 'TEST DATA',
        name: 'TEST01',
        date: '1 Jan. 2000',
        amount: 100,
        pct: 20,
        vat: '80',
        fileName: 'test01.png',
        fileUrl: 'https://firebasestorage.googleapis.com/v0/b/billable/test01.png',
        commentary: 'TEST BILLED',
        status: 'pending',
        commentAdmin: 'TEST COMMENT',
      };

      //Envoyer la nouvelle note des frais
      const bills = await firebase.post(testBill);
      // postSpy must have been called once
      expect(postSpy).toHaveBeenCalledTimes(1);
       // The number of bills must be 4

      expect(bills.data.length).toBe(5);
    });


    test('Then bill is posted and api throw an error 500', async () => {
      //simulation d'erreur 404(page introuvable)
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error('500')));      
      // user interface creation with error code
      const html = BillsUI({ error: '500' });
      document.body.innerHTML = html;
      const message = screen.getByText(/500/);
      expect(message).toBeTruthy();
    });

    test('Then bill is posted and api throw an error 404', async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error('404')));
      const html = BillsUI({ error: '404' });
      document.body.innerHTML = html;
      const message = screen.getByText(/404/);
      expect(message).toBeTruthy();
    });
  });
});
