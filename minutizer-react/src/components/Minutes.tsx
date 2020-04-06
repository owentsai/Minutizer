import React, { useEffect, useState } from "react";
import clsx from "clsx";
import {
  createStyles,
  lighten,
  makeStyles,
  Theme,
} from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import MailOutlineIcon from "@material-ui/icons/Email";
import CheckIcon from "@material-ui/icons/Check";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Alert from "@material-ui/lab/Alert";
import { connect } from "react-redux";

const mapStateToProps = ({ user }) => ({
  currentUser: user.currentUser,
});

export interface Data {
  meetingId: string;
  meetingName: string;
  meetingDate: string;
  organizerEmail: string;
}

function createData(
  meetingId: string,
  meetingName: string,
  meetingDate: string,
  organizerEmail: string
): Data {
  return {
    meetingId,
    meetingName,
    meetingDate,
    organizerEmail: organizerEmail,
  };
}

const COMPLETED_TRANSCRIPTION_URL =
  "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?completedProcessing=true";
const IN_PROGRESS_TRANSCRIPTION_URL =
  "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?inProgressProcessing=true";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = "asc" | "desc";

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  {
    id: "meetingId",
    numeric: false,
    disablePadding: true,
    label: "Meeting ID",
  },
  {
    id: "meetingName",
    numeric: true,
    disablePadding: false,
    label: "Meeting Name",
  },
  {
    id: "meetingDate",
    numeric: true,
    disablePadding: false,
    label: "Meeting Date",
  },
  {
    id: "organizerEmail",
    numeric: true,
    disablePadding: false,
    label: "Organizer",
  },
];

interface EnhancedTableProps {
  classes: ReturnType<typeof useStyles>;
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => void;
  onSelectAllClick: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  completed: boolean;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const {
    classes,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    completed,
  } = props;
  const createSortHandler = (property: keyof Data) => (
    event: React.MouseEvent<unknown>
  ) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {completed ? (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{ "aria-label": "select all" }}
            />
          </TableCell>
        ) : (
          <TableCell></TableCell>
        )}
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "default"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const useToolbarStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(1),
    },
    highlight:
      theme.palette.type === "light"
        ? {
            color: theme.palette.secondary.main,
            backgroundColor: lighten(theme.palette.secondary.light, 0.85),
          }
        : {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.secondary.dark,
          },
    title: {
      flex: "1 1 100%",
    },
  })
);

interface EnhancedTableToolbarProps {
  meetingIdsSelected: String[];
  meetingNamesSelected: String[];
  completed: boolean;
  currentUser: any;
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const classes = useToolbarStyles();
  const { meetingIdsSelected, meetingNamesSelected, completed } = props;
  const numSelected = meetingIdsSelected.length;
  const EMAIL_URL = `https://us-central1-hacksbc-268409.cloudfunctions.net/meeting-minutes-email`;
  let popUpTitle = "Sending " + numSelected + " minute(s)";
  let dialogText = "";
  let successfulRes = 0;
  const requestButtonHandler = async () => {
    if (numSelected) {
      handleClickOpen();
      const getUserIdToken = async () => {
        if (props.currentUser) {
          try {
            const token = await props.currentUser.getIdToken(false);
            return token;
          } catch (e) {
            console.log(e);
          }
        }
      };
      const authorizationHeaderValue: string =
        "Bearer " + (await getUserIdToken());
      const headers: Headers = new Headers();
      headers.append("Authorization", authorizationHeaderValue);
      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");
      // send requests to all selected meetings
      for (let i = 0; i < meetingIdsSelected.length; i++) {
        fetch(EMAIL_URL, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            meetingId: meetingIdsSelected[i],
            meetingName: meetingNamesSelected[i],
          }),
        })
          .then((res) => handleResponse(res))
          .catch((err) => handleError(err));
      }
    }
  };

  const handleResponse = (res) => {
    successfulRes++;
    if (successfulRes === numSelected) {
      showSuccessDialog();
    }
  };

  const handleError = (err) => {
    handleClose();
    setOpenErrorAlert(true);
  };

  const showSuccessDialog = () => {
    handleClose();
    setOpenSuccessAlert(true);
  };

  const [open, setOpen] = useState(false);
  const [openSuccessAlert, setOpenSuccessAlert] = useState(false);
  const [openErrorAlert, setOpenErrorAlert] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseErrorAlert = () => {
    setOpenErrorAlert(false);
  };

  const handleCloseSuccessAlert = () => {
    setOpenSuccessAlert(false);
    successfulRes = 0;
  };

  return (
    <div>
      {completed ? (
        <Toolbar
          className={clsx(classes.root, {
            [classes.highlight]: numSelected > 0,
          })}
        >
          {numSelected > 0 ? (
            <Typography
              className={classes.title}
              color="inherit"
              variant="subtitle1"
            >
              {numSelected} selected
            </Typography>
          ) : (
            <Typography className={classes.title} variant="h6" id="tableTitle">
              Meeting Minutes
            </Typography>
          )}
          <div onClick={() => requestButtonHandler()}>
            <IconButton aria-label="disabled" disabled={numSelected <= 0}>
              <MailOutlineIcon style={{ fontSize: 35 }} />
            </IconButton>
          </div>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">{popUpTitle}</DialogTitle>
            <DialogContent>
              <CircularProgress className="d-flex justify-content-center" />
              <DialogContentText id="alert-dialog-description">
                {dialogText}
              </DialogContentText>
            </DialogContent>
          </Dialog>

          <Dialog
            open={openSuccessAlert}
            onClose={handleCloseSuccessAlert}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogContent>
              <Alert
                className="d-flex justify-content-center"
                icon={<CheckIcon fontSize="inherit" />}
                severity="success"
              >
                Success
              </Alert>
              <DialogContentText id="alert-dialog-description">
                {dialogText}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseSuccessAlert} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openErrorAlert}
            onClose={handleCloseErrorAlert}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogContent>
              <Alert className="d-flex justify-content-center" severity="error">
                An error has occured
              </Alert>
              <DialogContentText id="alert-dialog-description">
                {dialogText}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseErrorAlert} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </Toolbar>
      ) : (
        <Toolbar>
          <Typography className={classes.title} variant="h6" id="tableTitle">
            In-Progress Transcriptions
          </Typography>
        </Toolbar>
      )}
    </div>
  );
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    paper: {
      width: "100%",
      marginBottom: theme.spacing(2),
    },
    table: {
      minWidth: 950,
      //maxWidth:1500,
    },
    visuallyHidden: {
      border: 0,
      clip: "rect(0 0 0 0)",
      height: 1,
      margin: -1,
      overflow: "hidden",
      padding: 0,
      position: "absolute",
      top: 20,
      width: 1,
    },
  })
);

const EnhancedTableToolbarWithRedux = connect(mapStateToProps)(
  EnhancedTableToolbar
);

function MyTable(props: { completed: boolean; currentUser: any }) {
  const classes = useStyles();
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<keyof Data>("meetingId");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedMeetingNames, setSelectedMeetingNames] = useState<string[]>(
    []
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [meetings, setMeetings] = useState<Data[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState<Boolean>(true);

  useEffect(() => {
    fetchMeetings().then((res) => setMeetings(meetings.concat(res)));
    setLoading(false);
  }, [loading]);

  const fetchMeetings = async () => {
    const TRANSCRIPTION_STATUS_URL = props.completed
      ? COMPLETED_TRANSCRIPTION_URL
      : IN_PROGRESS_TRANSCRIPTION_URL;
    const requestUrl = TRANSCRIPTION_STATUS_URL + `&page=${page}`;
    const getUserIdToken = async () => {
      if (props.currentUser) {
        try {
          const token = await props.currentUser.getIdToken(false);
          return token;
        } catch (e) {
          console.log(e);
        }
      }
    };
    const authorizationHeaderValue: string =
      "Bearer " + (await getUserIdToken());
    const header: Headers = new Headers();
    header.append("Authorization", authorizationHeaderValue);
    let res = await fetch(requestUrl, {
      method: "GET",
      headers: header,
    });
    let buf = await res.json();

    setCount(buf.total);
    let data: Data[] = Object.values(buf.data);
    data = data.map((el) =>
      createData(
        el.meetingId,
        el.meetingName,
        el.meetingDate,
        el.organizerEmail
      )
    );
    // maybe add some error checking

    return data;
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelectedIds = meetings.map((n) => n.meetingId);
      const newSelectedNames = meetings.map((n) => n.meetingName);
      setSelected(newSelectedIds);
      setSelectedMeetingNames(newSelectedNames);
      return;
    }
    setSelected([]);
    setSelectedMeetingNames([]);
  };

  const handleClick = (
    event: React.MouseEvent<unknown>,
    id: string,
    name: string
  ) => {
    const selectedIndex = selected.indexOf(id);

    let newSelected: string[] = [];
    let newNameSelected: string[] = [];

    if (selectedIndex === -1) {
      // if the selected row is not selected already
      newSelected = newSelected.concat(selected, id);
      newNameSelected = newNameSelected.concat(selectedMeetingNames, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
      newNameSelected = newNameSelected.concat(selectedMeetingNames.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
      newNameSelected = newNameSelected.concat(
        selectedMeetingNames.slice(0, -1)
      );
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
      newNameSelected = newNameSelected.concat(
        selectedMeetingNames.slice(0, selectedIndex),
        selectedMeetingNames.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
    setSelectedMeetingNames(newNameSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    if (meetings.length / 10 < newPage + 1) {
      // if have not loaded the meetings on this page
      setLoading(true);
    }
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name: any) => selected.indexOf(name) !== -1;

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, meetings.length - page * rowsPerPage);

  return (
    <div className="p-5 border-right border-secondary flex-fill text-center">
      <div className="shadow-lg card-l">
        <Paper
          className={classes.paper}
          style={{ borderRadius: "25px", padding: "15px" }}
        >
          <EnhancedTableToolbarWithRedux
            meetingIdsSelected={selected}
            meetingNamesSelected={selectedMeetingNames}
            completed={props.completed}
          />
          <TableContainer>
            {loading ? (
              <CircularProgress className="d-flex justify-content-center" />
            ) : (
              <Table
                className={classes.table}
                aria-labelledby="tableTitle"
                aria-label="enhanced table"
              >
                <EnhancedTableHead
                  classes={classes}
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={meetings.length}
                  completed={props.completed}
                />
                <TableBody>
                  {stableSort(meetings, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((meeting, index) => {
                      const isItemSelected = isSelected(meeting.meetingId);
                      const labelId = `enhanced-table-checkbox-${index}`;

                      return (
                        <TableRow
                          hover
                          onClick={(event) =>
                            handleClick(
                              event,
                              meeting.meetingId,
                              meeting.meetingName
                            )
                          }
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={meeting.meetingId}
                          selected={isItemSelected}
                        >
                          {props.completed ? (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isItemSelected}
                                inputProps={{ "aria-labelledby": labelId }}
                              />
                            </TableCell>
                          ) : (
                            <TableCell></TableCell>
                          )}
                          <TableCell
                            component="th"
                            id={labelId}
                            scope="row"
                            padding="none"
                          >
                            {meeting.meetingId}
                          </TableCell>
                          <TableCell align="right">
                            {meeting.meetingName}
                          </TableCell>
                          <TableCell align="right">
                            {meeting.meetingDate}
                          </TableCell>
                          <TableCell align="right">
                            {meeting.organizerEmail}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 33 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={count}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Paper>
      </div>
    </div>
  );
}

export default connect(mapStateToProps)(MyTable);
