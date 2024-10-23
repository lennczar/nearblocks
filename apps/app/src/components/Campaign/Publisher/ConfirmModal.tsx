import { DialogOverlay, DialogContent } from '@reach/dialog';
import { toast } from 'react-toastify';
import Close from '@/components/Icons/Close';
import { request } from '@/hooks/useAuth';
import { currentCampaign } from '@/utils/types';

type Props = {
  setConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentCampaign: currentCampaign | null;
  mutate: () => void;
};

const ConfirmModal = ({ setConfirmOpen, currentCampaign, mutate }: Props) => {
  const onSubmit = async () => {
    try {
      await request.post(`publisher/campaign/${currentCampaign?.id}/approve`);
      if (!toast.isActive('campaign-approved')) {
        toast.success('The campaign has been approved successfully', {
          toastId: 'campaign-approved',
        });
      }
      setConfirmOpen(false);
      mutate();
    } catch (error: any) {
      if (!toast.isActive('campaign-approve-error')) {
        toast.error(error?.response?.data, {
          toastId: 'campaign-approve-error',
        });
      }
      setConfirmOpen(false);
    }
  };
  return (
    <>
      <DialogOverlay className="fixed bg-gray-600 bg-opacity-20 inset-0 z-30 flex items-center justify-center">
        <DialogContent className="w-full max-w-lg mx-auto bg-white dark:bg-black-600 dark:text-neargray-10 shadow-lg rounded-lg overflow-hidden px-4 md:px-0">
          <div className="flex items-center justify-between  px-6 pt-8">
            <h4 className="flex items-center text-sm break-all">
              Confirm Campaign Approval
            </h4>
            <button
              className="text-gray-600 dark:text-neargray-10 fill-current"
              onClick={() => setConfirmOpen(false)}
            >
              <Close />
            </button>
          </div>
          <div className="px-6 pb-5 pt-2">
            <div className="py-2 pb-10">
              <p className="text-gray-600 dark:text-neargray-10 text-sm">
                Are you sure you want to approve this campaign?{' '}
              </p>
            </div>
            <div className="flex items-center justify-end  py-4">
              <p
                onClick={() => setConfirmOpen(false)}
                className="text-[13px] hover:delay-300 hover:duration-300 mx-1 hover:bg-gray-200 dark:hover:bg-black-200 px-4 py-2 cursor-pointer rounded"
              >
                Cancel
              </p>
              <button
                onClick={() => onSubmit()}
                className={`text-sm text-[13px] px-4 focus:outline-none text-white dark:text-neargray-10 text-center font-semibold py-2 bg-green-500 dark:bg-green-250 rounded transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-100 duration-300 hover:shadow-md hover:shadow-green-500`}
              >
                Submit
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogOverlay>
    </>
  );
};
export default ConfirmModal;
